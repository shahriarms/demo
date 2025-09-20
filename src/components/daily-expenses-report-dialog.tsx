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
import type { Expense } from '@/lib/types';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTranslation } from '@/hooks/use-translation';

interface DailyExpensesReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenses: Expense[];
}

export function DailyExpensesReportDialog({ open, onOpenChange, expenses }: DailyExpensesReportDialogProps) {
    const { t } = useTranslation();

    const reportData = useMemo(() => {
        if (!expenses) return [];
        return expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses]);

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(reportData.map(item => ({
            "Time": format(new Date(item.date), 'p'),
            "Category": item.mainCategory,
            "Name": item.name,
            "Amount": item.amount,
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Today's Expenses");
        XLSX.writeFile(workbook, `todays_expenses_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.text(`Today's Expenses Report - ${format(new Date(), 'PPP')}`, 14, 16);
        (doc as any).autoTable({
            head: [['Time', 'Category', 'Name', 'Amount']],
            body: reportData.map(item => [
                format(new Date(item.date), 'p'),
                item.mainCategory,
                item.name,
                '৳ '+item.amount.toFixed(2),
            ]),
            startY: 22,
        });
        doc.save(`todays_expenses_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    const totalExpenses = useMemo(() => reportData.reduce((sum, item) => sum + item.amount, 0), [reportData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Today's Expenses Report</DialogTitle>
          <DialogDescription>
            A detailed list of all expenses recorded today. Total Expenses: <strong>৳ {totalExpenses.toFixed(2)}</strong>
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
                <TableHead>Time</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length > 0 ? (
                reportData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{format(new Date(item.date), 'p')}</TableCell>
                    <TableCell>{item.mainCategory}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">৳ {item.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No expenses recorded for today.
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

    