

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import { useSettings } from '@/hooks/use-settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, FileText, ChevronRight, Calendar, DollarSign, Search, Printer, Loader2 } from 'lucide-react';
import type { Buyer, Invoice } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InvoicePrintLayout } from '@/components/invoice-print-layout';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';


export default function BuyersPage() {
  const { buyers, getInvoicesForBuyer, isAppDataLoading, printInvoice: appPrintInvoice, getPaymentsForInvoice } = useAppData();
  const { settings } = useSettings();
  const { t } = useTranslation();

  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [buyerSearchTerm, setBuyerSearchTerm] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);
  
  const handleSelectBuyer = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setSelectedInvoice(null); // Reset invoice selection when buyer changes
    setInvoiceSearchTerm('');
  };
  
  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  }

  const handlePrint = async () => {
    if (!selectedInvoice || isPrinting) return;
    
    // For POS printing, use the API route.
    if (settings.printFormat === 'pos' && settings.posPrinterType !== 'disabled') {
      setIsPrinting(true);
      try {
        await appPrintInvoice(selectedInvoice);
      } catch (error: any) {
        console.error(error.message);
      } finally {
        setIsPrinting(false);
      }
    } else {
      // For normal A4 printing, use the client-side print with a dedicated layout.
      setInvoiceToPrint(selectedInvoice);
    }
  };
  
  useEffect(() => {
    if (invoiceToPrint && settings.printFormat === 'normal') {
      setIsPrinting(true);
      const originalTitle = document.title;
      document.title = `invoice-${invoiceToPrint.id}`;
      
      const timer = setTimeout(() => {
        window.print();
        document.title = originalTitle;
        setInvoiceToPrint(null);
        setIsPrinting(false);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [invoiceToPrint, settings.printFormat]);
  
  const buyerInvoices = useMemo(() => {
    if (!selectedBuyer) return [];
    return getInvoicesForBuyer(selectedBuyer.id);
  }, [selectedBuyer, getInvoicesForBuyer]);

  const filteredInvoices = useMemo(() => {
    if (!invoiceSearchTerm) return buyerInvoices;
    return buyerInvoices.filter(invoice => 
        String(invoice.id).toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
        new Date(invoice.date).toLocaleDateString().toLowerCase().includes(invoiceSearchTerm.toLowerCase())
    );
  }, [buyerInvoices, invoiceSearchTerm]);
  
  const filteredBuyers = useMemo(() => {
    if (!buyerSearchTerm) return buyers;
    return buyers.filter(buyer => 
        buyer.name.toLowerCase().includes(buyerSearchTerm.toLowerCase()) ||
        (buyer.phone && buyer.phone.toLowerCase().includes(buyerSearchTerm.toLowerCase()))
    );
  }, [buyers, buyerSearchTerm]);
  
  if (isAppDataLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  const getInvoiceStatus = (invoice: Invoice) => {
    if (invoice.dueAmount <= 0.001) { // Add tolerance for float precision
      return { status: 'paid', color: 'text-green-600' };
    }
    if (invoice.paidAmount > 0 && invoice.dueAmount > 0) {
      return { status: 'partial', color: 'text-yellow-600' };
    }
    return { status: 'due', color: 'text-red-600' };
  };

  return (
    <>
      <div className="flex flex-col h-full gap-4 no-print">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Users className="w-6 h-6" />
              {t('buyers_page_title')}
          </h1>
        </div>
        <div className="grid md:grid-cols-5 gap-6 flex-1">
          {/* Buyers List */}
          <Card className="md:col-span-2 lg:col-span-1 flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle>{t('all_buyers_title')}</CardTitle>
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
                  {filteredBuyers.map((buyer) => (
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
                          <p className="text-sm text-muted-foreground">{buyer.address}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Invoice List */}
          <Card className="md:col-span-3 lg:col-span-1 flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="truncate">{selectedBuyer ? t('buyers_invoices_title', { name: selectedBuyer.name }) : t('invoice_log_title')}</CardTitle>
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
                      filteredInvoices.length > 0 ? (
                        filteredInvoices.map((invoice) => {
                          const { color, status } = getInvoiceStatus(invoice);
                          const isPaid = status === 'paid';
                          const paymentsForInvoice = isPaid ? getPaymentsForInvoice(invoice.id) : [];
                          const lastPaymentDate = isPaid && paymentsForInvoice.length > 0 ? format(new Date(paymentsForInvoice[0].date), 'PP') : null;

                          return (
                            <button
                              key={invoice.id}
                              onClick={() => handleSelectInvoice(invoice)}
                              className={`w-full text-left p-4 hover:bg-muted transition-colors ${
                                selectedInvoice?.id === invoice.id ? 'bg-muted' : ''
                              }`}
                            >
                                <div className={cn("font-medium", color)}>{t('inv_short')}: {invoice.id}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                    <Calendar className="w-3.5 h-3.5"/>
                                    <span>{new Date(invoice.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-baseline text-sm mt-1">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <DollarSign className="w-3.5 h-3.5"/>
                                    <span>৳ {invoice.subtotal.toFixed(2)}</span>
                                  </div>
                                  <span className={cn('font-semibold', color)}>
                                    {isPaid ? 'Paid' : `Due: ৳ ${invoice.dueAmount.toFixed(2)}`}
                                  </span>
                                </div>
                                {isPaid && lastPaymentDate && (
                                   <div className="text-xs text-green-600 mt-1">Paid on {lastPaymentDate}</div>
                                )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-center p-4 text-sm text-muted-foreground">{t('no_invoices_found')}</div>
                      )
                    ) : (
                      <div className="text-center p-4 text-sm text-muted-foreground">{t('select_a_buyer')}</div>
                    )}
                    </div>
                </ScrollArea>
            </CardContent>
          </Card>

          {/* Invoice Preview */}
          <Card className="md:col-span-5 lg:col-span-3 flex flex-col">
              <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>{t('invoice_details_title')}</CardTitle>
                  <Button onClick={handlePrint} disabled={!selectedInvoice || isPrinting}>
                      {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4"/>}
                      {t('print_invoice_button')}
                  </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                  {selectedInvoice ? (
                    <ScrollArea className="h-full">
                      <div className="p-4 bg-muted/50 rounded-lg min-w-[820px]">
                        <InvoicePrintLayout 
                              invoiceId={selectedInvoice.id}
                              currentDate={new Date(selectedInvoice.date).toLocaleDateString()}
                              customerName={selectedInvoice.customerName}
                              customerAddress={selectedInvoice.customerAddress}
                              customerPhone={selectedInvoice.customerPhone}
                              invoiceItems={selectedInvoice.items}
                              subtotal={selectedInvoice.subtotal}
                              paidAmount={selectedInvoice.paidAmount}
                              dueAmount={selectedInvoice.dueAmount}
                              printFormat={settings.printFormat}
                              locale={settings.locale}
                          />
                      </div>
                    </ScrollArea>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                          <FileText className="w-12 h-12 mb-4"/>
                          <h3 className="font-semibold">{t('no_invoice_selected_title')}</h3>
                          <p className="text-sm">{t('no_invoice_selected_description')}</p>
                      </div>
                  )}
              </CardContent>
          </Card>
        </div>
      </div>
      {invoiceToPrint && (
        <div className="print-source">
            <InvoicePrintLayout
                invoiceId={invoiceToPrint.id}
                currentDate={new Date(invoiceToPrint.date).toLocaleDateString()}
                customerName={invoiceToPrint.customerName}
                customerAddress={invoiceToPrint.customerAddress}
                customerPhone={invoiceToPrint.customerPhone}
                invoiceItems={invoiceToPrint.items}
                subtotal={invoiceToPrint.subtotal}
                paidAmount={invoiceToPrint.paidAmount}
                dueAmount={invoiceToPrint.dueAmount}
                printFormat={settings.printFormat}
                locale={settings.locale}
            />
        </div>
      )}
    </>
  );
}
