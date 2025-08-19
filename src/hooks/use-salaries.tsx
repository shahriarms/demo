
'use client';

import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import type { SalaryPayment, Employee } from '@/lib/types';
import { useEmployees } from './use-employees';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useAppData } from './use-app-data';

interface SalaryContextType {
  payments: SalaryPayment[];
  addSalaryPayment: (payment: Omit<SalaryPayment, 'id'>) => void;
  getPaymentsForMonth: (employeeId: string, date: Date) => SalaryPayment[];
  getDueSalaryForMonth: (employee: Employee, date: Date) => number;
}

const SalaryContext = createContext<SalaryContextType | undefined>(undefined);

const useSalariesData = (): SalaryContextType => {
  const { salaryPayments, setSalaryPayments } = useAppData();
  
  const addSalaryPayment = useCallback((paymentData: Omit<SalaryPayment, 'id'>) => {
    const newPayment: SalaryPayment = {
      ...paymentData,
      id: `sal-${Date.now()}`,
    };
    setSalaryPayments(prev => [newPayment, ...prev]);
  }, [setSalaryPayments]);

  const getPaymentsForMonth = useCallback((employeeId: string, date: Date): SalaryPayment[] => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    return salaryPayments
        .filter(p => p.employeeId === employeeId && isWithinInterval(new Date(p.date), { start: monthStart, end: monthEnd }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [salaryPayments]);

  const getDueSalaryForMonth = useCallback((employee: Employee, date: Date): number => {
      if (!employee) return 0;
      const paymentsThisMonth = getPaymentsForMonth(employee.id, date);
      const totalPaid = paymentsThisMonth.reduce((sum, p) => sum + p.amount, 0);
      return employee.salary - totalPaid;
  }, [getPaymentsForMonth]);


  return useMemo(() => ({
    payments: salaryPayments,
    addSalaryPayment,
    getPaymentsForMonth,
    getDueSalaryForMonth,
  }), [salaryPayments, addSalaryPayment, getPaymentsForMonth, getDueSalaryForMonth]);
}


export function useSalaries() {
  return useSalariesData();
}
