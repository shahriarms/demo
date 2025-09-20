
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import { useSettings } from '@/hooks/use-settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';


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
    if (!selectedInvoice) return;

    const doc = new jsPDF();
    const t = (key: Parameters<typeof useTranslation>[0]['t']>[0], options?: any) => {
        return translations[settings.locale || 'en'][key] || translations['en'][key];
    };
    const { translations } = require('@/lib/i18n/all');


    // Header
    doc.setFontSize(22);
    doc.text(t('shop_name'), doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(t('shop_description'), doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
    doc.text(`Email: engmahmud.mmm@gmail.com`, doc.internal.pageSize.getWidth() / 2, 33, { align: 'center' });


    // Customer Info
    doc.setFontSize(12);
    doc.text(`${t('customer_name_label')}: ${selectedInvoice.customerName}`, 14, 45);
    doc.text(`${t('customer_address_label')}: ${selectedInvoice.customerAddress}`, 14, 52);
    doc.text(`${t('customer_phone_label')}: ${selectedInvoice.customerPhone}`, 14, 59);

    doc.text(`${t('invoice_no_label')}: ${selectedInvoice.id}`, doc.internal.pageSize.getWidth() - 14, 45, { align: 'right' });
    doc.text(`${t('date_label')}: ${new Date(selectedInvoice.date).toLocaleDateString()}`, doc.internal.pageSize.getWidth() - 14, 52, { align: 'right' });

    // Table
    const tableColumn = [t('item_header'), t('quantity_header'), t('rate_header'), t('amount_header')];
    const tableRows: (string | number)[][] = [];

    selectedInvoice.items.forEach(item => {
        const itemData = [
            item.name,
            item.quantity,
            `৳${item.price.toFixed(2)}`,
            `৳${(item.price * item.quantity).toFixed(2)}`
        ];
        tableRows.push(itemData);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 65,
        headStyles: { fillColor: [22, 163, 74] },
    });
    
    // Totals
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.text(`${t('subtotal_label')}:`, 150, finalY + 10, { align: 'right' });
    doc.text(`৳${selectedInvoice.subtotal.toFixed(2)}`, 200, finalY + 10, { align: 'right' });
    doc.text(`${t('paid_label')}:`, 150, finalY + 17, { align: 'right' });
    doc.text(`৳${selectedInvoice.paidAmount.toFixed(2)}`, 200, finalY + 17, { align: 'right' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${t('due_label')}:`, 150, finalY + 25, { align: 'right' });
    doc.text(`৳${selectedInvoice.dueAmount.toFixed(2)}`, 200, finalY + 25, { align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    doc.save(`invoice-${selectedInvoice.id}.pdf`);
  };


  const handleSelectBuyer = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    const buyerInvoices = getInvoicesForBuyer(buyer.id);
    setInvoices(buyerInvoices);
    setSelectedInvoice(null);
    setInvoiceSearchTerm('');
  };
  
  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  }

  const filteredInvoices = useMemo(() => {
    if (!invoiceSearchTerm) return invoices;
    return invoices.filter(invoice => 
        String(invoice.id).toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
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
      <div className="grid md:grid-cols-5 gap-6 flex-1">
        {/* Buyers List */}
        <Card className="md:col-span-2 lg:col-span-1 flex flex-col no-print">
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
        <Card className="md:col-span-3 lg:col-span-1 flex flex-col no-print">
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
                      filteredInvoices.map((invoice) => (
                        <button
                          key={invoice.id}
                          onClick={() => handleSelectInvoice(invoice)}
                          className={`w-full text-left p-4 hover:bg-muted transition-colors ${
                            selectedInvoice?.id === invoice.id ? 'bg-muted' : ''
                          }`}
                        >
                            <div className="font-medium">{t('inv_short')}: {invoice.id}</div>
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

        {/* Invoice Display */}
        <Card className="md:col-span-5 lg:col-span-3 flex flex-col">
            <CardHeader className="flex-row items-center justify-between no-print">
              <CardTitle>{t('invoice_details_title')}</CardTitle>
              {selectedInvoice && (
                  <Button onClick={handlePrint} disabled={!selectedInvoice}>
                      <Printer className="mr-2 h-4 w-4" />
                      {t('print_invoice_button')}
                  </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
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
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
