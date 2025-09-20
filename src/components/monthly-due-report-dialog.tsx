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

interface MonthlyDueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
  dateRange?: DateRange;
}

export function MonthlyDueDialog({ open, onOpenChange, invoices, dateRange }: MonthlyDueDialogProps) {
    const { t } = useTranslation();

    const rangeTitle = useMemo(() => {
        if (!dateRange?.from) return "Due Report";
        const from = dateRange.from;
        const to = dateRange.to || from;

        if (isSameDay(from, startOfMonth(from)) && isSameDay(to, endOfMonth(from))) {
            return `Due Report (${format(from, 'MMMM yyyy')})`;
        }
        if (isSameDay(from, to)) {
            return `Due Report (${format(from, 'PPP')})`;
        }
        return `Due Report (${format(from, 'PP')} - ${format(to, 'PP')})`;
    }, [dateRange]);

    const reportData = useMemo(() => {
        if (!invoices) return [];
        return invoices
          .filter(invoice => invoice.dueAmount > 0)
          .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices]);

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(reportData.map(item => ({
            "Date": format(new Date(item.date), 'PP'),
            "Invoice ID": String(item.id),
            "Customer Name": item.customerName,
            "Total Amount": item.subtotal,
            "Paid Amount": item.paidAmount,
            "Due Amount": item.dueAmount,
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Due Invoices Report");
        XLSX.writeFile(workbook, `due_report.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.text(rangeTitle, 14, 16);
        (doc as any).autoTable({
            head: [['Date', 'Inv No', 'Customer Name', 'Total', 'Paid', 'Due']],
            body: reportData.map(item => [
                format(new Date(item.date), 'PP'),
                String(item.id),
                item.customerName,
                '৳ '+item.subtotal.toFixed(2),
                '৳ '+item.paidAmount.toFixed(2),
                '৳ '+item.dueAmount.toFixed(2),
            ]),
            startY: 22,
        });
        doc.save(`due_report.pdf`);
    };

    const totalDue = useMemo(() => reportData.reduce((sum, item) => sum + item.dueAmount, 0), [reportData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{rangeTitle}</DialogTitle>
          <DialogDescription>
            A detailed list of all invoices from this range with an outstanding balance. Total Due: <strong>৳ {totalDue.toFixed(2)}</strong>
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
                <TableHead>Inv No</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length > 0 ? (
                reportData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{format(new Date(item.date), 'PP')}</TableCell>
                    <TableCell className="font-mono text-xs">{String(item.id)}</TableCell>
                    <TableCell className="font-medium">{item.customerName}</TableCell>
                    <TableCell className="text-right font-mono">৳ {item.subtotal.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-green-600">৳ {item.paidAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-destructive">৳ {item.dueAmount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No due invoices recorded for this date range.
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

    