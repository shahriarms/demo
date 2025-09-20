'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter as UiTableFooter,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileDown, FileText } from 'lucide-react';
import type { Invoice } from '@/lib/types';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTranslation } from '@/hooks/use-translation';
import { Separator } from './ui/separator';

interface DailySalesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
}

export function DailySalesDialog({ open, onOpenChange, invoices }: DailySalesDialogProps) {
    const { t } = useTranslation();

    const sortedInvoices = useMemo(() => {
        if (!invoices) return [];
        return [...invoices].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices]);

    const handleExportExcel = () => {
        const flattenedData = sortedInvoices.flatMap(invoice => 
            invoice.items.map(item => ({
                "Invoice No": String(invoice.id),
                "Time": format(new Date(invoice.date), 'p'),
                "Customer Name": invoice.customerName,
                "Item Name": item.name,
                "Quantity": item.quantity,
                "Rate": item.price,
                "Total": item.price * item.quantity,
            }))
        );

        const worksheet = XLSX.utils.json_to_sheet(flattenedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Today's Sales");
        XLSX.writeFile(workbook, `todays_sales_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.text(`Today's Sales Report - ${format(new Date(), 'PPP')}`, 14, 16);
        
        let finalY = 22;
        sortedInvoices.forEach(invoice => {
            if (finalY > 260) { // Add new page if content overflows
                doc.addPage();
                finalY = 22;
            }
            doc.setFontSize(10);
            doc.text(`Invoice #${invoice.id} - ${invoice.customerName} (${format(new Date(invoice.date), 'p')})`, 14, finalY);
            finalY += 5;
            (doc as any).autoTable({
                head: [['Item Name', 'Qty', 'Rate', 'Total']],
                body: invoice.items.map(item => [
                    item.name,
                    item.quantity,
                    '৳ '+item.price.toFixed(2),
                    '৳ '+(item.price * item.quantity).toFixed(2),
                ]),
                startY: finalY,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [230, 230, 230], textColor: 20 },
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
        });

        doc.save(`todays_sales_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    const totalSales = useMemo(() => sortedInvoices.reduce((sum, inv) => sum + inv.subtotal, 0), [sortedInvoices]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Today's Sales Report</DialogTitle>
          <DialogDescription>
            A detailed breakdown of all invoices from today. Grand Total: <strong>৳ {totalSales.toFixed(2)}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel}><FileDown className="mr-2 h-4 w-4" /> Export as Excel</Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf}><FileDown className="mr-2 h-4 w-4" /> Export as PDF</Button>
        </div>

        <ScrollArea className="h-[60vh] rounded-md border p-4">
            {sortedInvoices.length > 0 ? (
                <div className="space-y-6">
                    {sortedInvoices.map((invoice, index) => (
                        <div key={invoice.id} className="space-y-2">
                             <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-muted-foreground"/>
                                <h3 className="font-semibold">Invoice #{invoice.id}</h3>
                                <span className="text-sm text-muted-foreground">- {invoice.customerName}</span>
                                <span className="text-sm text-muted-foreground ml-auto">{format(new Date(invoice.date), 'p')}</span>
                            </div>
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Rate</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right font-mono">৳{item.price.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-mono font-semibold">৳{(item.price * item.quantity).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <UiTableFooter>
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-right font-bold">Invoice Total</TableCell>
                                        <TableCell className="text-right font-bold font-mono">৳{invoice.subtotal.toFixed(2)}</TableCell>
                                    </TableRow>
                                </UiTableFooter>
                            </Table>
                            {index < sortedInvoices.length - 1 && <Separator className="mt-6!"/>}
                        </div>
                    ))}
                     <div className="border-t-2 border-dashed pt-4 mt-6">
                        <div className="flex justify-end text-lg font-bold">
                            <span className="mr-4">Grand Total:</span>
                            <span className="font-mono">৳{totalSales.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex justify-center items-center h-full text-center text-muted-foreground">
                    <div>
                        <FileText className="mx-auto h-12 w-12" />
                        <p className="mt-4">No sales recorded for today.</p>
                    </div>
                </div>
            )}
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
