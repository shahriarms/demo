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
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTranslation } from '@/hooks/use-translation';
import type { DateRange } from 'react-day-picker';

interface MonthlySalesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
  dateRange?: DateRange;
}

interface ReportItem {
  date: string;
  customerName: string;
  itemName: string;
  quantity: number;
  rate: number;
  total: number;
}

export function MonthlySalesDialog({ open, onOpenChange, invoices, dateRange }: MonthlySalesDialogProps) {
    const { t } = useTranslation();

    const rangeTitle = useMemo(() => {
        if (!dateRange?.from) return "Report";
        const from = dateRange.from;
        const to = dateRange.to || from;

        if (isSameDay(from, startOfMonth(from)) && isSameDay(to, endOfMonth(from))) {
            return `Sales Report (${format(from, 'MMMM yyyy')})`;
        }
        if (isSameDay(from, to)) {
            return `Sales Report (${format(from, 'PPP')})`;
        }
        return `Sales Report (${format(from, 'PP')} - ${format(to, 'PP')})`;
    }, [dateRange]);

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
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
        XLSX.writeFile(workbook, `sales_report.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.text(rangeTitle, 14, 16);
        (doc as any).autoTable({
            head: [['Date', 'Customer Name', 'Item Name', 'Quantity', 'Rate', 'Total']],
            body: reportData.map(item => [
                item.date,
                item.customerName,
                item.itemName,
                item.quantity,
                '৳ '+item.rate.toFixed(2),
                '৳ '+item.total.toFixed(2),
            ]),
            startY: 22,
        });
        doc.save(`sales_report.pdf`);
    };

    const totalSales = useMemo(() => reportData.reduce((sum, item) => sum + item.total, 0), [reportData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{rangeTitle}</DialogTitle>
          <DialogDescription>
            A detailed list of all items sold in the selected date range. Total Sales: <strong>৳ {totalSales.toFixed(2)}</strong>
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
                    <TableCell className="text-right font-mono"><span className="text-muted-foreground">৳</span> {item.rate.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold"><span className="text-muted-foreground">৳</span> {item.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No sales recorded for this date range.
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

    