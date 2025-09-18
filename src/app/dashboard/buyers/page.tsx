
'use client';

import React, { useState, useMemo, useRef } from 'react';
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


export default function BuyersPage() {
  const { buyers, getInvoicesForBuyer, isAppDataLoading } = useAppData();
  const { settings } = useSettings();
  const { t } = useTranslation();

  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [buyerSearchTerm, setBuyerSearchTerm] = useState('');

  const componentToPrintRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    // New simplified print logic using global CSS
    window.print();
  };


  const handleSelectBuyer = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    const buyerInvoices = getInvoicesForBuyer(buyer.id);
    setInvoices(buyerInvoices);
    setSelectedInvoice(buyerInvoices.length > 0 ? buyerInvoices[0] : null);
    setInvoiceSearchTerm('');
  };
  
  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  }

  const filteredInvoices = useMemo(() => {
    if (!invoiceSearchTerm) return invoices;
    return invoices.filter(invoice => 
        invoice.id.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
        new Date(invoice.date).toLocaleDateString().toLowerCase().includes(invoiceSearchTerm.toLowerCase())
    );
  }, [invoices, invoiceSearchTerm]);
  
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

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between no-print">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="w-6 h-6" />
            {t('buyers_page_title')}
        </h1>
      </div>
      <div className="grid md:grid-cols-3 gap-6 flex-1">
        {/* Buyers List & Invoice Log */}
        <div className="md:col-span-1 flex flex-col gap-6 no-print">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="space-y-4 flex-shrink-0">
                <CardTitle>{t('all_buyers_title')}</CardTitle>
                <div className="relative">
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

            <Card className="flex-1 flex flex-col">
               <CardHeader className="space-y-4 flex-shrink-0">
                 <CardTitle className="truncate">{selectedBuyer ? t('buyers_invoices_title', { name: selectedBuyer.name }) : t('invoice_log_title')}</CardTitle>
                 <div className="relative">
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
                          filteredInvoices.map((invoice) => (
                            <button
                              key={invoice.id}
                              onClick={() => handleSelectInvoice(invoice)}
                              className={`w-full text-left p-4 hover:bg-muted transition-colors ${
                                selectedInvoice?.id === invoice.id ? 'bg-muted' : ''
                              }`}
                            >
                                <div className="font-medium">{t('inv_short')}: {invoice.id.slice(-6)}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                    <Calendar className="w-3.5 h-3.5"/>
                                    <span>{new Date(invoice.date).toLocaleDateString()}</span>
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                   <DollarSign className="w-3.5 h-3.5"/>
                                   <span>৳{invoice.subtotal.toFixed(2)}</span>
                                </div>
                            </button>
                          ))
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
        </div>

        {/* Invoice Display */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between no-print">
              <h2 className="text-lg font-semibold">{t('invoice_details_title')}</h2>
              {selectedInvoice && (
                  <Button onClick={handlePrint} disabled={!selectedInvoice}>
                      <Printer className="mr-2 h-4 w-4" />
                      {t('print_invoice_button')}
                  </Button>
              )}
          </div>
          <div className="bg-background">
            {selectedInvoice ? (
                 <div ref={componentToPrintRef} className="print-source">
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
                      // Always use normal print for past invoices from this page
                      printFormat={'normal'} 
                      locale={settings.locale}
                   />
                 </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground h-full flex flex-col justify-center items-center rounded-lg border no-print">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="font-semibold">{t('no_invoice_selected_title')}</p>
                  <p className="text-sm">{t('no_invoice_selected_description')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
