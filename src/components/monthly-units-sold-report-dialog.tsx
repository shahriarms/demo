
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
import type { Invoice, Product } from '@/lib/types';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTranslation } from '@/hooks/use-translation';
import type { DateRange } from 'react-day-picker';

interface MonthlyUnitsSoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
  products: Product[];
  dateRange?: DateRange;
}

interface ReportItem {
    id: string;
    name: string;
    totalQuantity: number;
    unit: 'kg' | 'pcs';
}

export function MonthlyUnitsSoldDialog({ open, onOpenChange, invoices, products, dateRange }: MonthlyUnitsSoldDialogProps) {
    const { t } = useTranslation();

    const rangeTitle = useMemo(() => {
        if (!dateRange?.from) return "Units Sold Report";
        const from = dateRange.from;
        const to = dateRange.to || from;

        if (isSameDay(from, startOfMonth(from)) && isSameDay(to, endOfMonth(from))) {
            return `Units Sold Report (${format(from, 'MMMM yyyy')})`;
        }
        if (isSameDay(from, to)) {
            return `Units Sold Report (${format(from, 'PPP')})`;
        }
        return `Units Sold Report (${format(from, 'PP')} - ${format(to, 'PP')})`;
    }, [dateRange]);

    const reportData = useMemo((): ReportItem[] => {
        if (!invoices || !products) return [];
        
        const soldItemsMap = new Map<string, number>();

        invoices.forEach(invoice => {
            invoice.items.forEach(item => {
                soldItemsMap.set(item.id, (soldItemsMap.get(item.id) || 0) + item.quantity);
            });
        });

        return Array.from(soldItemsMap.entries()).map(([productId, totalQuantity]) => {
            const product = products.find(p => p.id === productId);
            return {
                id: productId,
                name: product?.name || 'Unknown Product',
                totalQuantity,
                unit: product?.mainCategory === 'Material' ? 'kg' : 'pcs',
            };
        }).sort((a,b) => b.totalQuantity - a.totalQuantity);

    }, [invoices, products]);

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(reportData.map(item => ({
            "Item Name": item.name,
            "Total Quantity Sold": item.totalQuantity,
            "Unit": item.unit,
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Units Sold Report");
        XLSX.writeFile(workbook, `units_sold_report.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.text(rangeTitle, 14, 16);
        (doc as any).autoTable({
            head: [['Item Name', 'Total Quantity Sold', 'Unit']],
            body: reportData.map(item => [
                item.name,
                item.totalQuantity,
                item.unit,
            ]),
            startY: 22,
        });
        doc.save(`units_sold_report.pdf`);
    };
    
    const totalUnits = useMemo(() => reportData.reduce((sum, item) => sum + item.totalQuantity, 0), [reportData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rangeTitle}</DialogTitle>
          <DialogDescription>
            A summary of total quantities sold for each item in this range. Total Units: <strong>{totalUnits}</strong>
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
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Total Quantity Sold</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length > 0 ? (
                reportData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right font-semibold">{item.totalQuantity}</TableCell>
                    <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No units sold in this date range.
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
