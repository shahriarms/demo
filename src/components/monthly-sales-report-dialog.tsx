
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
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileDown } from 'lucide-react';
import type { Invoice } from '@/lib/types';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTranslation } from '@/hooks/use-translation';

interface MonthlySalesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
  month: Date;
}

interface ReportItem {
  date: string;
  customerName: string;
  itemName: string;
  quantity: number;
  rate: number;
  total: number;
}

export function MonthlySalesDialog({ open, onOpenChange, invoices, month }: MonthlySalesDialogProps) {
    const { t } = useTranslation();

    const reportData = useMemo((): ReportItem[] => {
        if (!invoices) return [];
        return invoices.flatMap(invoice => 
            invoice.items.map(item => ({
                date: format(new Date(invoice.date), 'PP'),
                customerName: invoice.customerName,
                itemName: item.name,
                quantity: item.quantity,
                rate: item.price,
                total: item.price * item.quantity,
            }))
        ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices]);

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(reportData.map(item => ({
            "Date": item.date,
            "Customer Name": item.customerName,
            "Item Name": item.itemName,
            "Quantity": item.quantity,
            "Rate": item.rate,
            "Total": item.total,
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Sales");
        XLSX.writeFile(workbook, `monthly_sales_${format(month, 'yyyy-MM')}.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.text(`Monthly Sales Report - ${format(month, 'MMMM yyyy')}`, 14, 16);
        (doc as any).autoTable({
            head: [['Date', 'Customer Name', 'Item Name', 'Quantity', 'Rate', 'Total']],
            body: reportData.map(item => [
                item.date,
                item.customerName,
                item.itemName,
                item.quantity,
                `৳${item.rate.toFixed(2)}`,
                `৳${item.total.toFixed(2)}`,
            ]),
            startY: 22,
        });
        doc.save(`monthly_sales_${format(month, 'yyyy-MM')}.pdf`);
    };

    const totalSales = useMemo(() => reportData.reduce((sum, item) => sum + item.total, 0), [reportData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Monthly Sales Report ({format(month, 'MMMM yyyy')})</DialogTitle>
          <DialogDescription>
            A detailed list of all items sold this month. Total Sales: <strong>৳{totalSales.toFixed(2)}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel}><FileDown className="mr-2 h-4 w-4" /> Export as Excel</Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf}><FileDown className="mr-2 h-4 w-4" /> Export as PDF</Button>
        </div>

        <ScrollArea className="h-[60vh] rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length > 0 ? (
                reportData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">{item.date}</TableCell>
                    <TableCell>{item.customerName}</TableCell>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right font-mono">৳{item.rate.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">৳{item.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No sales recorded for this month.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
