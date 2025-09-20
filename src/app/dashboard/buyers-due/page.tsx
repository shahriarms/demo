
'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, FileText, ChevronRight, DollarSign, HandCoins, History, Printer, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PaymentReceipt } from '@/components/payment-receipt';
import { useTranslation } from '@/hooks/use-translation';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';


export default function BuyersDuePage() {
  const { invoices: allInvoices, buyers, getInvoicesForBuyer, addPayment, getPaymentsForInvoice, isAppDataLoading, getBuyerById } = useAppData();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [buyerSearchTerm, setBuyerSearchTerm] = useState('');
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  
  const [isConfirmingPayment, setConfirmingPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSuccessfulPayment, setLastSuccessfulPayment] = useState<{payment: Payment, invoice: Invoice, buyer: Buyer} | null>(null);
  
  const componentToPrintRef = useRef(null);
  const numericPaymentAmount = useMemo(() => parseFloat(paymentAmount) || 0, [paymentAmount]);
  
  // This effect ensures that if the underlying data changes (e.g. after a payment),
  // the selected items are refreshed with the latest data.
  useEffect(() => {
    if (selectedBuyer) {
      const refreshedBuyer = buyers.find(b => b.id === selectedBuyer.id);
      if (refreshedBuyer) {
        setSelectedBuyer(refreshedBuyer);
      } else { // Buyer might not exist anymore
        setSelectedBuyer(null);
        setSelectedInvoice(null);
      }
    }
    if (selectedInvoice) {
        const refreshedInvoice = allInvoices.find(inv => inv.id === selectedInvoice.id);
        if (refreshedInvoice) {
            setSelectedInvoice(refreshedInvoice);
        } else { // Invoice might not exist anymore (e.g. fully paid and filtered out)
            setSelectedInvoice(null);
        }
    }
  }, [allInvoices, buyers, selectedBuyer, selectedInvoice]);

  const handleOpenConfirmation = () => {
    if (!selectedInvoice || !selectedBuyer || numericPaymentAmount <= 0) {
      toast({ variant: 'destructive', title: t('invalid_amount_toast_title'), description: t('invalid_amount_toast_description') });
      return;
    }
    // Add a small tolerance for floating point comparisons
    if (numericPaymentAmount > selectedInvoice.dueAmount + 0.001) {
        toast({ variant: 'destructive', title: t('overpayment_error_toast_title'), description: t('overpayment_error_toast_description', { amount: selectedInvoice.dueAmount.toFixed(2) }) });
        return;
    }
    setConfirmingPayment(true);
  };

  const handleConfirmAndProcessPayment = async () => {
    if (!selectedInvoice || !selectedBuyer || numericPaymentAmount <= 0) return;

    setIsProcessing(true);
    setConfirmingPayment(false);

    const paymentPayload = {
      invoiceId: selectedInvoice.id,
      buyerId: selectedBuyer.id,
      amount: numericPaymentAmount,
    };

    const result = await addPayment(paymentPayload);

    setIsProcessing(false);

    if (result) {
        const { payment, updatedInvoice } = result;
        toast({
            title: t('payment_received_toast_title'),
            description: t('payment_received_toast_description', { amount: payment.amount.toFixed(2), invoiceId: payment.invoiceId }),
        });
        
        setLastSuccessfulPayment({ payment, invoice: updatedInvoice, buyer: selectedBuyer });
        
        setPaymentAmount('');
    } else {
        // Error toast is handled inside addPayment hook
    }
  };
  
  // Effect to trigger printing after a successful payment
  useEffect(() => {
    if (lastSuccessfulPayment) {
      // Temporarily set the document title for the print-to-PDF filename
      const originalTitle = document.title;
      document.title = `payment-receipt-for-invoice-${lastSuccessfulPayment.invoice.id}`;
      
      const timer = setTimeout(() => {
        window.print();
        // Restore the original title after the print dialog is closed
        document.title = originalTitle;
        // Clear the successful payment state to prevent re-printing on re-renders.
        setLastSuccessfulPayment(null);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [lastSuccessfulPayment]);


  const buyersWithDue = useMemo(() => buyers.filter(b => getInvoicesForBuyer(b.id).some(inv => inv.dueAmount > 0.001)), [buyers, getInvoicesForBuyer]);
  const filteredBuyersWithDue = useMemo(() => buyerSearchTerm ? buyersWithDue.filter(b => b.name.toLowerCase().includes(buyerSearchTerm.toLowerCase()) || (b.phone && b.phone.toLowerCase().includes(buyerSearchTerm.toLowerCase()))) : buyersWithDue, [buyersWithDue, buyerSearchTerm]);
  
  const dueInvoicesForSelectedBuyer = useMemo(() => {
    if (!selectedBuyer) return [];
    // Show all invoices, not just due ones, to see the "Paid" status.
    return getInvoicesForBuyer(selectedBuyer.id);
  }, [selectedBuyer, getInvoicesForBuyer]);

  const filteredDueInvoices = useMemo(() => {
    if (!dueInvoicesForSelectedBuyer) return [];
    const searchTermLower = invoiceSearchTerm.toLowerCase();
    const invoices = invoiceSearchTerm 
      ? dueInvoicesForSelectedBuyer.filter(inv => String(inv.id).toLowerCase().includes(searchTermLower) || new Date(inv.date).toLocaleDateString().toLowerCase().includes(searchTermLower)) 
      : dueInvoicesForSelectedBuyer;
    
    // Create a temporary view of invoices with pending payment for real-time UI updates
    return invoices.map(inv => {
        if (inv.id === selectedInvoice?.id && numericPaymentAmount > 0) {
            return {
                ...inv,
                dueAmount: Math.max(0, inv.dueAmount - numericPaymentAmount)
            };
        }
        return inv;
    });

  }, [dueInvoicesForSelectedBuyer, invoiceSearchTerm, selectedInvoice, numericPaymentAmount]);

  const paymentHistoryForReceipt = useMemo(() => {
    if (!lastSuccessfulPayment) return [];
    return getPaymentsForInvoice(lastSuccessfulPayment.invoice.id);
  }, [lastSuccessfulPayment, getPaymentsForInvoice]);

  const handleSelectBuyer = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setSelectedInvoice(null);
    setInvoiceSearchTerm('');
    setPaymentAmount('');
  };

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(allInvoices.find(i => i.id === invoice.id) || null);
    setPaymentAmount('');
  };
  
  const currentDueForSelectedInvoice = useMemo(() => {
    if (!selectedInvoice) return 0;
    if (numericPaymentAmount > 0) {
      return Math.max(0, selectedInvoice.dueAmount - numericPaymentAmount);
    }
    return selectedInvoice.dueAmount;
  }, [selectedInvoice, numericPaymentAmount]);


  if (isAppDataLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <div className="flex flex-col h-full gap-4 no-print">
        <h1 className="text-2xl font-semibold flex items-center gap-2 no-print">
          <HandCoins className="w-6 h-6" />
          {t('buyers_due_page_title')}
        </h1>
        <div className="grid md:grid-cols-5 gap-6 flex-1">
          <Card className="md:col-span-2 lg:col-span-1 flex flex-col no-print">
            <CardHeader className="flex-shrink-0">
              <CardTitle>{t('buyers_with_due_title')}</CardTitle>
              <div className="relative pt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder={t('search_by_name_or_phone_placeholder')} className="pl-8" value={buyerSearchTerm} onChange={e => setBuyerSearchTerm(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="divide-y">
                  {filteredBuyersWithDue.length > 0 ? filteredBuyersWithDue.map((buyer) => (
                    <button key={buyer.id} onClick={() => handleSelectBuyer(buyer)} className={`w-full text-left p-4 hover:bg-muted transition-colors ${selectedBuyer?.id === buyer.id ? 'bg-muted' : '' }`}>
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

          <Card className="md:col-span-3 lg:col-span-1 flex flex-col no-print">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="truncate">{selectedBuyer ? t('due_invoices_title') : t('select_buyer_title')}</CardTitle>
              <CardDescription>{selectedBuyer ? t('for_buyer_subtitle', { name: selectedBuyer.name }) : t('outstanding_balances_subtitle')}</CardDescription>
              <div className="relative pt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder={t('search_by_invoice_no_or_date_placeholder')} className="pl-8" value={invoiceSearchTerm} onChange={e => setInvoiceSearchTerm(e.target.value)} disabled={!selectedBuyer} />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="divide-y">
                  {selectedBuyer ? (
                    filteredDueInvoices.length > 0 ? (
                      filteredDueInvoices.map((invoice) => {
                        const isPaid = invoice.dueAmount <= 0.001;
                        const paymentsForInvoice = getPaymentsForInvoice(invoice.id);
                        const lastPaymentDate = paymentsForInvoice.length > 0 ? format(new Date(paymentsForInvoice[0].date), 'PP') : null;
                        
                        return (
                        <button key={invoice.id} onClick={() => handleSelectInvoice(invoice)} className={`w-full text-left p-4 hover:bg-muted transition-colors ${selectedInvoice?.id === invoice.id ? 'bg-muted' : '' }`}>
                          <div className="flex justify-between font-medium">
                              <span>{t('inv_short')}: {invoice.id}</span>
                              {isPaid ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">Paid</Badge>
                              ) : (
                                <span className="text-destructive">৳ {invoice.dueAmount.toFixed(2)}</span>
                              )}
                          </div>
                          <div className="text-sm text-muted-foreground">{new Date(invoice.date).toLocaleDateString()}</div>
                          {isPaid && lastPaymentDate && (
                            <div className="text-xs text-green-600 mt-1">Paid on {lastPaymentDate}</div>
                          )}
                        </button>
                        );
                      })
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
          
          <Card className="md:col-span-5 lg:col-span-3 flex flex-col">
              <CardHeader className='no-print'>
                  <CardTitle>{t('receive_payment_title')}</CardTitle>
                  <CardDescription>{t('receive_payment_description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 no-print">
                  {selectedInvoice ? (
                      <>
                          <div className="flex justify-between items-start p-4 bg-muted/50 rounded-lg">
                            <div>
                                <p>{t('invoice_label')}: <span className="font-mono">{selectedInvoice.id}</span></p>
                                <p>Original Due: <span className="font-mono">৳ {selectedInvoice.dueAmount.toFixed(2)}</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg">New Due:</p>
                                <p className="font-bold text-destructive text-2xl">৳ {currentDueForSelectedInvoice.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                              <div className="relative flex-1 w-full">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">৳</span>
                                  <Input 
                                    type="text" 
                                    inputMode="decimal" 
                                    placeholder={t('enter_amount_placeholder')} 
                                    className="pl-8" 
                                    value={paymentAmount} 
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    disabled={isProcessing || selectedInvoice.dueAmount <= 0} 
                                  />
                              </div>
                              <Button onClick={handleOpenConfirmation} className="w-full sm:w-auto" disabled={isProcessing || numericPaymentAmount <= 0 || selectedInvoice.dueAmount <= 0}>
                                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4"/>}
                                  {t('receive_and_print_button')}
                              </Button>
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
                           {/* This is for on-screen preview only */}
                           <div className="no-print">
                            {(selectedBuyer && selectedInvoice) ? (
                                <PaymentReceipt
                                    buyer={selectedBuyer}
                                    invoice={selectedInvoice}
                                    paymentHistory={getPaymentsForInvoice(selectedInvoice.id)}
                                    newPaymentAmount={numericPaymentAmount}
                                />
                            ) : (
                                <div className="text-center text-muted-foreground p-8 flex flex-col justify-center items-center h-full border rounded-lg">
                                    <FileText className="w-12 h-12 mb-4 text-muted-foreground/50"/>
                                    <p>{t('select_invoice_for_preview')}</p>
                                </div>
                            )}
                           </div>

                      </div>
                  </div>
              </div>
          </Card>
        </div>
      </div>
      <div className="print-source">
        {lastSuccessfulPayment && (
            <PaymentReceipt
                buyer={lastSuccessfulPayment.buyer}
                invoice={lastSuccessfulPayment.invoice}
                paymentHistory={paymentHistoryForReceipt}
                newPaymentAmount={lastSuccessfulPayment.payment.amount}
            />
        )}
      </div>
      <AlertDialog open={isConfirmingPayment} onOpenChange={setConfirmingPayment}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                  <AlertDialogDescription>
                      You are about to receive a payment of <strong>৳ {numericPaymentAmount.toFixed(2)}</strong> for invoice <strong>#{selectedInvoice?.id}</strong>.
                      <br />
                      Original Due: ৳ {selectedInvoice?.dueAmount.toFixed(2)}
                      <br />
                      New Due will be: <strong>৳ {currentDueForSelectedInvoice.toFixed(2)}</strong>
                      <br /><br />
                      This will save the payment and print a receipt.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmAndProcessPayment} disabled={isProcessing}>
                      {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirm and Print
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    

    

    