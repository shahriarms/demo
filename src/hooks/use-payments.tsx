
'use client';

import { createContext, useContext, useMemo, useCallback } from 'react';
import type { Payment } from '@/lib/types';
import { useInvoices } from './use-invoices';
import { useAppData } from './use-app-data';

interface PaymentContextType {
  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id' | 'date'>) => void;
  getPaymentsForInvoice: (invoiceId: string) => Payment[];
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

const usePaymentsData = (): PaymentContextType => {
  const { payments, setPayments } = useAppData();
  const { updateInvoiceDue } = useInvoices();

  const addPayment = useCallback((paymentData: Omit<Payment, 'id' | 'date'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setPayments(prev => [...prev, newPayment]);
    updateInvoiceDue(paymentData.invoiceId, paymentData.amount);
  }, [updateInvoiceDue, setPayments]);

  const getPaymentsForInvoice = useCallback((invoiceId: string) => {
    return payments
      .filter(p => p.invoiceId === invoiceId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments]);

  return useMemo(() => ({ payments, addPayment, getPaymentsForInvoice }), [payments, addPayment, getPaymentsForInvoice]);
}


export function usePayments() {
  return usePaymentsData();
}
