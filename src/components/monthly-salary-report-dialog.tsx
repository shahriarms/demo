
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
import type { SalaryPayment, Employee } from '@/lib/types';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTranslation } from '@/hooks/use-translation';

interface MonthlySalaryReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salaryPayments: SalaryPayment[];
  employees: Employee[];
  month: Date;
}

interface ReportItem {
    date: string;
    employeeName: string;
    amount: number;
    paidBy: string;
}

export function MonthlySalaryReportDialog({ open, onOpenChange, salaryPayments, employees, month }: MonthlySalaryReportDialogProps) {
    const { t } = useTranslation();

    const reportData = useMemo((): ReportItem[] => {
        if (!salaryPayments || !employees) return [];
        return salaryPayments.map(payment => {
            const employee = employees.find(e => e.id === payment.employeeId);
            return {
                date: format(new Date(payment.date), 'PP'),
                employeeName: employee?.name || 'Unknown Employee',
                amount: payment.amount,
                paidBy: payment.paidBy,
            };
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [salaryPayments, employees]);

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(reportData.map(item => ({
            "Date": item.date,
            "Employee Name": item.employeeName,
            "Amount Paid": item.amount,
            "Paid By": item.paidBy,
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Salary Payments");
        XLSX.writeFile(workbook, `monthly_salary_payments_${format(month, 'yyyy-MM')}.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.text(`Monthly Salary Payments Report - ${format(month, 'MMMM yyyy')}`, 14, 16);
        (doc as any).autoTable({
            head: [['Date', 'Employee Name', 'Amount Paid', 'Paid By']],
            body: reportData.map(item => [
                item.date,
                item.employeeName,
                `৳${item.amount.toFixed(2)}`,
                item.paidBy,
            ]),
            startY: 22,
        });
        doc.save(`monthly_salary_payments_${format(month, 'yyyy-MM')}.pdf`);
    };

    const totalPaid = useMemo(() => reportData.reduce((sum, item) => sum + item.amount, 0), [reportData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Monthly Salary Payments Report ({format(month, 'MMMM yyyy')})</DialogTitle>
          <DialogDescription>
            A detailed list of all salary payments made this month. Total Paid: <strong>৳{totalPaid.toFixed(2)}</strong>
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
                <TableHead>Employee Name</TableHead>
                <TableHead>Paid By</TableHead>
                <TableHead className="text-right">Amount Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length > 0 ? (
                reportData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">{item.date}</TableCell>
                    <TableCell className="font-medium">{item.employeeName}</TableCell>
                    <TableCell className="text-muted-foreground">{item.paidBy}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">৳{item.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No salary payments recorded for this month.
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
