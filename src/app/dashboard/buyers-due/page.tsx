
'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import type { Buyer, Invoice, Payment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, FileText, ChevronRight, DollarSign, HandCoins, History, Printer, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PaymentReceipt } from '@/components/payment-receipt';
import { useTranslation } from '@/hooks/use-translation';


export default function BuyersDuePage() {
  const { buyers, getInvoicesForBuyer, addPayment, getPaymentsForInvoice, isAppDataLoading } = useAppData();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [buyerSearchTerm, setBuyerSearchTerm] = useState('');
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  
  const componentToPrintRef = useRef(null);

  const buyersWithDue = useMemo(() => {
    return buyers.filter(buyer => {
      const invoices = getInvoicesForBuyer(buyer.id);
      return invoices.some(inv => inv.dueAmount > 0);
    });
  }, [buyers, getInvoicesForBuyer]);
  
  const filteredBuyersWithDue = useMemo(() => {
    if (!buyerSearchTerm) return buyersWithDue;
    return buyersWithDue.filter(buyer => 
        buyer.name.toLowerCase().includes(buyerSearchTerm.toLowerCase()) ||
        (buyer.phone && buyer.phone.toLowerCase().includes(buyerSearchTerm.toLowerCase()))
    );
  }, [buyersWithDue, buyerSearchTerm]);

  const dueInvoicesForSelectedBuyer = useMemo(() => {
    if (!selectedBuyer) return [];
    return getInvoicesForBuyer(selectedBuyer.id).filter(inv => inv.dueAmount > 0);
  }, [selectedBuyer, getInvoicesForBuyer]);

  const filteredDueInvoices = useMemo(() => {
    if (!invoiceSearchTerm) return dueInvoicesForSelectedBuyer;
    return dueInvoicesForSelectedBuyer.filter(invoice => 
        invoice.id.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
        new Date(invoice.date).toLocaleDateString().toLowerCase().includes(invoiceSearchTerm.toLowerCase())
    );
  }, [dueInvoicesForSelectedBuyer, invoiceSearchTerm]);
  
  const paymentHistory = useMemo(() => {
    if (!selectedInvoice) return [];
    return getPaymentsForInvoice(selectedInvoice.id);
  }, [selectedInvoice, getPaymentsForInvoice]);

  const handleSelectBuyer = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setSelectedInvoice(null);
    setInvoiceSearchTerm('');
  };

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount('');
  };
  
  const completePaymentTransaction = useCallback(() => {
    if (!selectedInvoice || !paymentAmount || paymentAmount <= 0) return;

    addPayment({
      invoiceId: selectedInvoice.id,
      buyerId: selectedBuyer!.id,
      amount: paymentAmount as number,
    });
    
    toast({
        title: t('payment_received_toast_title'),
        description: t('payment_received_toast_description', { amount: (paymentAmount as number).toFixed(2), invoiceId: selectedInvoice.id.slice(-6) }),
    });

    setPaymentAmount('');
    
    // Refresh data - a bit of a trick to force re-render with updated due amounts
    const updatedBuyer = buyers.find(b => b.id === selectedBuyer!.id);
    if(updatedBuyer) {
        // Find the specific buyer and re-set it to trigger updates
        const freshBuyerData = JSON.parse(JSON.stringify(buyers.find(b => b.id === selectedBuyer!.id)));
        setSelectedBuyer(freshBuyerData);
    }
  }, [addPayment, paymentAmount, selectedBuyer, selectedInvoice, toast, buyers, t]);


  const handleAddPaymentAndPrint = () => {
    if (!selectedInvoice || !paymentAmount || paymentAmount <= 0) {
      toast({
        variant: 'destructive',
        title: t('invalid_amount_toast_title'),
        description: t('invalid_amount_toast_description'),
      });
      return;
    }

    if (paymentAmount > selectedInvoice.dueAmount) {
        toast({
          variant: 'destructive',
          title: t('overpayment_error_toast_title'),
          description: t('overpayment_error_toast_description', { amount: selectedInvoice.dueAmount.toFixed(2) }),
        });
        return;
    }
    
    // The transaction is completed first, then we print the new state.
    completePaymentTransaction();

    // We need to wait for the state to update before printing
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const receiptPaymentHistory = useMemo(() => {
    if (!selectedInvoice || paymentAmount === '' || typeof paymentAmount !== 'number' || !selectedBuyer) return paymentHistory;
    const pendingPayment: Payment = {
        id: 'pending',
        invoiceId: selectedInvoice.id,
        buyerId: selectedBuyer.id,
        amount: paymentAmount as number,
        date: new Date().toISOString(),
    };
    return [pendingPayment, ...paymentHistory];
  }, [paymentHistory, paymentAmount, selectedInvoice, selectedBuyer]);

  if (isAppDataLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2 no-print">
        <HandCoins className="w-6 h-6" />
        {t('buyers_due_page_title')}
      </h1>
      <div className="grid md:grid-cols-5 gap-6 flex-1">
        {/* Buyers with Due List */}
        <Card className="md:col-span-2 lg:col-span-1 flex flex-col no-print">
          <CardHeader className="flex-shrink-0">
            <CardTitle>{t('buyers_with_due_title')}</CardTitle>
            <div className="relative pt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    type="search" 
                    placeholder={t('search_by_name_or_phone_placeholder')}
                    className="pl-8" 
                    value={buyerSearchTerm}
                    onChange={e => setBuyerSearchTerm(e.target.value)}
                />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="divide-y">
                {filteredBuyersWithDue.length > 0 ? filteredBuyersWithDue.map((buyer) => (
                  <button
                    key={buyer.id}
                    onClick={() => handleSelectBuyer(buyer)}
                    className={`w-full text-left p-4 hover:bg-muted transition-colors ${
                      selectedBuyer?.id === buyer.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{buyer.name}</p>
                        <p className="text-sm text-muted-foreground">{buyer.phone}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </button>
                )) : (
                    <div className="p-4 text-center text-muted-foreground">{t('no_buyers_with_due')}</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Due Invoices List */}
        <Card className="md:col-span-3 lg:col-span-1 flex flex-col no-print">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="truncate">{selectedBuyer ? t('due_invoices_title') : t('select_buyer_title')}</CardTitle>
            <CardDescription>{selectedBuyer ? t('for_buyer_subtitle', { name: selectedBuyer.name }) : t('outstanding_balances_subtitle')}</CardDescription>
            <div className="relative pt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    type="search" 
                    placeholder={t('search_by_invoice_no_or_date_placeholder')}
                    className="pl-8" 
                    value={invoiceSearchTerm}
                    onChange={e => setInvoiceSearchTerm(e.target.value)}
                    disabled={!selectedBuyer}
                />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="divide-y">
                {selectedBuyer ? (
                  filteredDueInvoices.length > 0 ? (
                    filteredDueInvoices.map((invoice) => (
                      <button
                        key={invoice.id}
                        onClick={() => handleSelectInvoice(invoice)}
                        className={`w-full text-left p-4 hover:bg-muted transition-colors ${
                          selectedInvoice?.id === invoice.id ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex justify-between font-medium">
                            <span>{t('inv_short')}: {invoice.id.slice(-6)}</span>
                            <span className="text-destructive">${invoice.dueAmount.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{new Date(invoice.date).toLocaleDateString()}</div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">{t('buyer_has_no_due_invoices')}</div>
                  )
                ) : (
                  <div className="p-4 text-center text-muted-foreground">{t('select_buyer_to_see_dues')}</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Payment Section */}
        <Card className="md:col-span-5 lg:col-span-3 flex flex-col">
            <CardHeader className='no-print'>
                <CardTitle>{t('receive_payment_title')}</CardTitle>
                <CardDescription>{t('receive_payment_description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 no-print">
                {selectedInvoice ? (
                    <>
                        <div className="flex justify-between items-start">
                           <div>
                              <p>{t('invoice_label')}: <span className="font-mono">{selectedInvoice.id.slice(-6)}</span></p>
                              <p>{t('due_amount_label')}: <span className="font-bold text-destructive">${selectedInvoice.dueAmount.toFixed(2)}</span></p>
                           </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <div className="relative flex-1 w-full">
                                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="number" 
                                    placeholder={t('enter_amount_placeholder')}
                                    className="pl-8"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                />
                            </div>
                            <Button onClick={handleAddPaymentAndPrint} className="w-full sm:w-auto"><Printer className="mr-2 h-4 w-4"/>{t('receive_and_print_button')}</Button>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-muted-foreground py-8">{t('select_invoice_to_receive_payment')}</div>
                )}
            </CardContent>
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 px-6 pt-4 no-print">
                    <History className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">{t('live_receipt_preview_title')}</h3>
                </div>
                <div className="p-6 pt-2 flex-1">
                     <div className="bg-background">
                        {selectedBuyer && selectedInvoice ? (
                           <div ref={componentToPrintRef} className="print-source">
                                <PaymentReceipt
                                    buyer={selectedBuyer}
                                    invoice={selectedInvoice}
                                    paymentHistory={receiptPaymentHistory}
                                    newPaymentAmount={typeof paymentAmount === 'number' ? paymentAmount : 0}
                                />
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground p-8 flex flex-col justify-center items-center h-full border rounded-lg no-print">
                                <FileText className="w-12 h-12 mb-4 text-muted-foreground/50"/>
                                <p>{t('select_invoice_for_preview')}</p>
                           </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
}

    