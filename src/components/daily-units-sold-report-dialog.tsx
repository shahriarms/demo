
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
import { FileDown, ThumbsUp, Weight } from 'lucide-react';
import type { Invoice, Product } from '@/lib/types';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTranslation } from '@/hooks/use-translation';

interface DailyUnitsSoldReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
  products: Product[];
}

interface ReportItem {
    id: string;
    name: string;
    totalQuantity: number;
}

export function DailyUnitsSoldReportDialog({ open, onOpenChange, invoices, products }: DailyUnitsSoldReportDialogProps) {
    const { t } = useTranslation();

    const { hardwareItems, materialItems, totalHardwarePcs, totalMaterialKg } = useMemo(() => {
        if (!invoices || !products) return { hardwareItems: [], materialItems: [], totalHardwarePcs: 0, totalMaterialKg: 0 };
        
        const soldItemsMap = new Map<string, { totalQuantity: number; mainCategory: 'Hardware' | 'Material' }>();
        const productMap = new Map(products.map(p => [p.id, p]));

        invoices.forEach(invoice => {
            invoice.items.forEach(item => {
                const product = productMap.get(item.id);
                if (product) {
                    const existing = soldItemsMap.get(item.id) || { totalQuantity: 0, mainCategory: product.mainCategory };
                    existing.totalQuantity += item.quantity;
                    soldItemsMap.set(item.id, existing);
                }
            });
        });

        const allItems: (ReportItem & { mainCategory: 'Hardware' | 'Material' })[] = Array.from(soldItemsMap.entries()).map(([productId, data]) => ({
            id: productId,
            name: productMap.get(productId)?.name || 'Unknown Product',
            totalQuantity: data.totalQuantity,
            mainCategory: data.mainCategory,
        })).sort((a,b) => b.totalQuantity - a.totalQuantity);

        const hardwareItems = allItems.filter(item => item.mainCategory === 'Hardware');
        const materialItems = allItems.filter(item => item.mainCategory === 'Material');
        const totalHardwarePcs = hardwareItems.reduce((sum, item) => sum + item.totalQuantity, 0);
        const totalMaterialKg = materialItems.reduce((sum, item) => sum + item.totalQuantity, 0);

        return { hardwareItems, materialItems, totalHardwarePcs, totalMaterialKg };

    }, [invoices, products]);

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        if (hardwareItems.length > 0) {
            const hwSheet = XLSX.utils.json_to_sheet(hardwareItems.map(item => ({ "Item Name": item.name, "Total Quantity Sold (pcs)": item.totalQuantity })));
            XLSX.utils.book_append_sheet(wb, hwSheet, "Hardware Items");
        }
        if (materialItems.length > 0) {
            const matSheet = XLSX.utils.json_to_sheet(materialItems.map(item => ({ "Item Name": item.name, "Total Quantity Sold (kg)": item.totalQuantity })));
            XLSX.utils.book_append_sheet(wb, matSheet, "Material Items");
        }
        XLSX.writeFile(wb, `todays_units_sold_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.text(`Today's Units Sold Report - ${format(new Date(), 'PPP')}`, 14, 16);
        let startY = 22;

        if (hardwareItems.length > 0) {
            doc.setFontSize(12);
            doc.text("Hardware Items", 14, startY);
            startY += 6;
            (doc as any).autoTable({
                head: [['Item Name', 'Total Quantity Sold (pcs)']],
                body: hardwareItems.map(item => [item.name, item.totalQuantity]),
                startY,
            });
            startY = (doc as any).lastAutoTable.finalY + 10;
        }

        if (materialItems.length > 0) {
             if (startY > 250) { doc.addPage(); startY = 22; }
            doc.setFontSize(12);
            doc.text("Material Items", 14, startY);
            startY += 6;
            (doc as any).autoTable({
                head: [['Item Name', 'Total Quantity Sold (kg)']],
                body: materialItems.map(item => [item.name, item.totalQuantity.toFixed(2)]),
                startY,
            });
        }
        
        doc.save(`todays_units_sold_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Today's Units Sold Report</DialogTitle>
          <DialogDescription>
            A summary of total quantities sold for each item today.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel}><FileDown className="mr-2 h-4 w-4" /> Export as Excel</Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf}><FileDown className="mr-2 h-4 w-4" /> Export as PDF</Button>
        </div>

        <ScrollArea className="h-[60vh] rounded-md border p-4 space-y-6">
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-2"><ThumbsUp /> Hardware Items (pcs)</h3>
            <Table>
                <TableHeader><TableRow><TableHead>Item Name</TableHead><TableHead className="text-right">Quantity</TableHead></TableRow></TableHeader>
                <TableBody>
                {hardwareItems.length > 0 ? (
                    hardwareItems.map(item => (
                        <TableRow key={item.id}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="text-right font-semibold">{item.totalQuantity}</TableCell></TableRow>
                    ))
                ) : (<TableRow><TableCell colSpan={2} className="h-24 text-center">No hardware items sold.</TableCell></TableRow>)}
                </TableBody>
                <UiTableFooter>
                    <TableRow>
                        <TableCell className="font-bold">Total Hardware</TableCell>
                        <TableCell className="text-right font-bold">{totalHardwarePcs} pcs</TableCell>
                    </TableRow>
                </UiTableFooter>
            </Table>
          </div>
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-2"><Weight /> Material Items (kg)</h3>
            <Table>
                <TableHeader><TableRow><TableHead>Item Name</TableHead><TableHead className="text-right">Quantity</TableHead></TableRow></TableHeader>
                <TableBody>
                {materialItems.length > 0 ? (
                    materialItems.map(item => (
                        <TableRow key={item.id}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="text-right font-semibold">{item.totalQuantity.toFixed(2)}</TableCell></TableRow>
                    ))
                ) : (<TableRow><TableCell colSpan={2} className="h-24 text-center">No material items sold.</TableCell></TableRow>)}
                </TableBody>
                <UiTableFooter>
                    <TableRow>
                        <TableCell className="font-bold">Total Material</TableCell>
                        <TableCell className="text-right font-bold">{totalMaterialKg.toFixed(2)} kg</TableCell>
                    </TableRow>
                </UiTableFooter>
            </Table>
          </div>
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
