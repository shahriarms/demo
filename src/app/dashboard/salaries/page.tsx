
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useEmployees } from '@/hooks/use-employees';
import { useSalaries } from '@/hooks/use-salaries';
import { useUser } from '@/hooks/use-user';
import type { Employee, SalaryPayment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Users, ChevronRight, DollarSign, Wallet, History, AlertCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';

export default function SalariesPage() {
  const { employees } = useEmployees();
  const { user } = useUser();
  const { getPaymentsForMonth, addSalaryPayment, getDueSalaryForMonth } = useSalaries();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  
  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setPaymentAmount('');
  };

  const { dueSalary, paidThisMonth, paymentsThisMonth } = useMemo(() => {
    if (!selectedEmployee) {
      return { dueSalary: 0, paidThisMonth: 0, paymentsThisMonth: [] };
    }
    const payments = getPaymentsForMonth(selectedEmployee.id, new Date());
    const paid = payments.reduce((acc, p) => acc + p.amount, 0);
    const due = getDueSalaryForMonth(selectedEmployee, new Date());

    return {
      dueSalary: due,
      paidThisMonth: paid,
      paymentsThisMonth: payments,
    };
  }, [selectedEmployee, getPaymentsForMonth, getDueSalaryForMonth]);

  const isOverpayment = useMemo(() => {
      if (typeof paymentAmount !== 'number' || !selectedEmployee) return false;
      return paymentAmount > dueSalary;
  }, [paymentAmount, dueSalary, selectedEmployee]);

  const canProcessPayment = useMemo(() => {
      if (typeof paymentAmount !== 'number' || paymentAmount <= 0) return false;
      if (isOverpayment && user?.role !== 'admin') return false;
      return true;
  }, [paymentAmount, isOverpayment, user]);

  const handleAddPayment = useCallback(() => {
    if (!selectedEmployee || typeof paymentAmount !== 'number' || paymentAmount <= 0) {
      toast({
        variant: 'destructive',
        title: t('invalid_amount_toast_title'),
        description: t('invalid_amount_toast_description'),
      });
      return;
    }

    if (isOverpayment && user?.role !== 'admin') {
      toast({
        variant: 'destructive',
        title: t('overpayment_error_toast_title'),
        description: t('overpayment_permission_error'),
      });
      return;
    }

    addSalaryPayment({
      employeeId: selectedEmployee.id,
      amount: paymentAmount,
      date: new Date().toISOString(),
      paidBy: user?.email || 'unknown',
    });

    toast({
      title: t('payment_successful_toast_title'),
      description: t('payment_successful_toast_description', { amount: paymentAmount.toFixed(2), name: selectedEmployee.name }),
    });
    
    // Optimistically update the selected employee to re-trigger memos
    const freshEmployeeData = JSON.parse(JSON.stringify(employees.find(e => e.id === selectedEmployee.id)));
    setSelectedEmployee(freshEmployeeData);

    setPaymentAmount('');

  }, [selectedEmployee, paymentAmount, isOverpayment, user, addSalaryPayment, toast, employees, t]);


  return (
    <div className="flex flex-col h-full gap-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Wallet className="w-6 h-6" />
        {t('salaries_page_title')}
      </h1>
      <div className="grid md:grid-cols-3 gap-6 flex-1">
        {/* Employee List */}
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>{t('employee_list_title')}</CardTitle>
            <CardDescription>{t('salaries_employee_list_description')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <ScrollArea className="h-full max-h-[calc(100vh-250px)]">
              <div className="divide-y">
                {employees.map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => handleSelectEmployee(employee)}
                    className={`w-full text-left p-4 hover:bg-muted transition-colors ${
                      selectedEmployee?.id === employee.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.role}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Payment Processing Card */}
        <Card className="md:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>{t('process_salary_payment_title')}</CardTitle>
             <CardDescription>
                {selectedEmployee ? t('for_employee_subtitle', { name: selectedEmployee.name }) : t('select_employee_from_list')}
             </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedEmployee ? (
                <div className="text-center text-muted-foreground py-12">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground/50"/>
                    <p className="mt-4">{t('please_select_employee')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Payment Input Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">{t('payment_details_title')}</h3>
                        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                            <div className="flex justify-between text-sm"><span>{t('monthly_salary_label')}:</span> <span className="font-mono">${selectedEmployee.salary.toFixed(2)}</span></div>
                            <div className="flex justify-between text-sm"><span>{t('paid_this_month_label')}:</span> <span className="font-mono">${paidThisMonth.toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>{t('due_this_month_label')}:</span> <span className="font-mono text-primary">${dueSalary.toFixed(2)}</span></div>
                        </div>

                        <div className="relative">
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                type="number" 
                                placeholder={t('enter_amount_to_pay_placeholder')}
                                className="pl-8"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            />
                        </div>
                        
                        {isOverpayment && (
                            <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${user?.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                {user?.role === 'admin' ? <ShieldCheck className="h-5 w-5"/> : <AlertCircle className="h-5 w-5"/>}
                                <div>
                                    <p className="font-semibold">
                                     {user?.role === 'admin' ? t('admin_advance_payment') : t('amount_exceeds_due')}
                                    </p>
                                    <p>{user?.role === 'admin' ? t('authorizing_advance_payment') : t('ask_admin_for_approval')}</p>
                                </div>
                            </div>
                        )}
                        
                        <Button className="w-full" disabled={!canProcessPayment} onClick={handleAddPayment}>
                            {t('pay_button', { amount: typeof paymentAmount === 'number' ? paymentAmount.toFixed(2) : '0.00' })}
                        </Button>
                    </div>

                    {/* Payment History Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><History className="w-5 h-5"/> {t('monthly_payment_history_title')}</h3>
                        <ScrollArea className="h-64 rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('date_header')}</TableHead>
                                        <TableHead className="text-right">{t('amount_header')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentsThisMonth.length > 0 ? (
                                        paymentsThisMonth.map(payment => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{format(new Date(payment.date), 'PP')}</TableCell>
                                                <TableCell className="text-right font-mono">${payment.amount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">
                                                {t('no_payments_this_month')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
