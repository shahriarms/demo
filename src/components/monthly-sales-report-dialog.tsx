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
  totalSales: number;
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
        const salesByDay = new Map<string, number>();

        invoices.forEach(invoice => {
            const dateKey = format(new Date(invoice.date), 'yyyy-MM-dd');
            salesByDay.set(dateKey, (salesByDay.get(dateKey) || 0) + invoice.subtotal);
        });
        
        return Array.from(salesByDay.entries())
            .map(([date, totalSales]) => ({
                date: format(new Date(date), 'PP'),
                totalSales,
            }))
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [invoices]);

    const totalSales = useMemo(() => reportData.reduce((sum, item) => sum + item.totalSales, 0), [reportData]);

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(reportData.map(item => ({
            "Date": item.date,
            "Total Sales": item.totalSales,
        })));
        
        // Add total row
        const totalRow = { "Date": "Grand Total", "Total Sales": totalSales };
        XLSX.utils.sheet_add_json(worksheet, [totalRow], { skipHeader: true, origin: -1 });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
        XLSX.writeFile(workbook, `sales_report.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.text(rangeTitle, 14, 16);
        (doc as any).autoTable({
            head: [['Date', 'Total Sales']],
            body: reportData.map(item => [
                item.date,
                '৳ '+item.totalSales.toFixed(2),
            ]),
            foot: [['Grand Total', '৳ '+totalSales.toFixed(2)]],
            footStyles: { fontStyle: 'bold' },
            startY: 22,
        });
        doc.save(`sales_report.pdf`);
    };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{rangeTitle}</DialogTitle>
          <DialogDescription>
            A summary of total sales per day within the selected date range. Grand Total: <strong>৳ {totalSales.toFixed(2)}</strong>
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
                <TableHead className="text-right">Total Sales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length > 0 ? (
                reportData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{item.date}</TableCell>
                    <TableCell className="text-right font-mono font-semibold"><span className="text-muted-foreground">৳</span> {item.totalSales.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    No sales recorded for this date range.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {reportData.length > 0 && (
                <UiTableFooter>
                    <TableRow>
                        <TableCell className="font-bold">Grand Total</TableCell>
                        <TableCell className="text-right font-bold font-mono">৳ {totalSales.toFixed(2)}</TableCell>
                    </TableRow>
                </UiTableFooter>
            )}
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
