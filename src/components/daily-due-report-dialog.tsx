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

interface DailyDueReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
}

export function DailyDueReportDialog({ open, onOpenChange, invoices }: DailyDueReportDialogProps) {
    const { t } = useTranslation();

    const reportData = useMemo(() => {
        if (!invoices) return [];
        return invoices
          .filter(invoice => invoice.dueAmount > 0)
          .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices]);

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(reportData.map(item => ({
            "Invoice ID": String(item.id),
            "Customer Name": item.customerName,
            "Total Amount": item.subtotal,
            "Paid Amount": item.paidAmount,
            "Due Amount": item.dueAmount,
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Today's Due Invoices");
        XLSX.writeFile(workbook, `todays_due_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.text(`Today's Due Invoices - ${format(new Date(), 'PPP')}`, 14, 16);
        (doc as any).autoTable({
            head: [['Inv No', 'Customer Name', 'Total', 'Paid', 'Due']],
            body: reportData.map(item => [
                String(item.id),
                item.customerName,
                '৳ '+item.subtotal.toFixed(2),
                '৳ '+item.paidAmount.toFixed(2),
                '৳ '+item.dueAmount.toFixed(2),
            ]),
            startY: 22,
        });
        doc.save(`todays_due_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    const totalDue = useMemo(() => reportData.reduce((sum, item) => sum + item.dueAmount, 0), [reportData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Today's Due Report</DialogTitle>
          <DialogDescription>
            A detailed list of all invoices from today with an outstanding balance. Total Due: <strong>&#2547; {totalDue.toFixed(2)}</strong>
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
                    <TableCell className="font-mono text-xs">{String(item.id)}</TableCell>
                    <TableCell className="font-medium">{item.customerName}</TableCell>
                    <TableCell className="text-right font-mono">&#2547; {item.subtotal.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-green-600">&#2547; {item.paidAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-destructive">&#2547; {item.dueAmount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No due invoices recorded for today.
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

    