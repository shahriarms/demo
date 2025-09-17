
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { Product, Invoice, Buyer, Expense, Employee, Attendance, SalaryPayment, Payment } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import type { DraftInvoice } from './use-invoice-form';

// Initial data fallbacks
const createNewDraft = (): DraftInvoice => ({
    id: `draft-${Date.now()}`,
    buyerId: '',
    items: [],
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    paidAmount: 0,
    subtotal: 0,
    dueAmount: 0,
});

const STORAGE_KEYS = {
    products: 'stockpilot-products',
    invoices: 'stockpilot-invoices',
    buyers: 'stockpilot-buyers',
    expenses: 'stockpilot-expenses',
    employees: 'stockpilot-employees',
    attendance: 'stockpilot-attendance',
    salaryPayments: 'stockpilot-salary-payments',
    payments: 'stockpilot-payments',
    invoiceDrafts: 'stockpilot-invoice-drafts',
    activeInvoiceDraftIndex: 'stockpilot-active-invoice-draft-index'
};

interface AppDataContextType {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    buyers: Buyer[];
    setBuyers: React.Dispatch<React.SetStateAction<Buyer[]>>;
    expenses: Expense[];
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
    employees: Employee[];
    setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
    attendance: Attendance[];
    setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
    salaryPayments: SalaryPayment[];
    setSalaryPayments: React.Dispatch<React.SetStateAction<SalaryPayment[]>>;
    payments: Payment[];
    setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
    invoiceDrafts: DraftInvoice[];
    setInvoiceDrafts: React.Dispatch<React.SetStateAction<DraftInvoice[]>>;
    activeInvoiceDraftIndex: number;
    setActiveInvoiceDraftIndex: React.Dispatch<React.SetStateAction<number>>;
    isAppDataLoading: boolean;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [invoiceDrafts, setInvoiceDrafts] = useState<DraftInvoice[]>([]);
    const [activeInvoiceDraftIndex, setActiveInvoiceDraftIndex] = useState(0);
    const [isAppDataLoading, setIsAppDataLoading] = useState(true);

    // Load all data from localStorage at once
    useEffect(() => {
        try {
            const data = {
                products: JSON.parse(localStorage.getItem(STORAGE_KEYS.products) || '[]'),
                invoices: JSON.parse(localStorage.getItem(STORAGE_KEYS.invoices) || '[]'),
                buyers: JSON.parse(localStorage.getItem(STORAGE_KEYS.buyers) || '[]'),
                expenses: JSON.parse(localStorage.getItem(STORAGE_KEYS.expenses) || '[]'),
                employees: JSON.parse(localStorage.getItem(STORAGE_KEYS.employees) || '[]'),
                attendance: JSON.parse(localStorage.getItem(STORAGE_KEYS.attendance) || '[]'),
                salaryPayments: JSON.parse(localStorage.getItem(STORAGE_KEYS.salaryPayments) || '[]'),
                payments: JSON.parse(localStorage.getItem(STORAGE_KEYS.payments) || '[]'),
                invoiceDrafts: JSON.parse(localStorage.getItem(STORAGE_KEYS.invoiceDrafts) || 'null') || [createNewDraft()],
                activeInvoiceDraftIndex: JSON.parse(localStorage.getItem(STORAGE_KEYS.activeInvoiceDraftIndex) || '0'),
            };

            // Data Migration / Validation
            const migratedProducts = data.products.map((p: any) => {
                if (typeof p.sellingPrice !== 'number' || isNaN(p.sellingPrice)) {
                    const buyingPrice = p.buyingPrice || 0;
                    const profitMargin = p.profitMargin || 0;
                    p.sellingPrice = buyingPrice + (buyingPrice * profitMargin / 100);
                }
                return p;
            });

            setProducts(migratedProducts);
            setInvoices(data.invoices);
            setBuyers(data.buyers);
            setExpenses(data.expenses);
            setEmployees(data.employees);
            setAttendance(data.attendance);
            setSalaryPayments(data.salaryPayments);
            setPayments(data.payments);
            setInvoiceDrafts(data.invoiceDrafts.length > 0 ? data.invoiceDrafts : [createNewDraft()]);
            setActiveInvoiceDraftIndex(data.activeInvoiceDraftIndex);

        } catch (error) {
            console.error("Failed to load app data from localStorage", error);
        } finally {
            setIsAppDataLoading(false);
        }
    }, []);

    // Save all data to localStorage whenever any piece of it changes
    useEffect(() => {
        if (!isAppDataLoading) {
            localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
            localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(invoices));
            localStorage.setItem(STORAGE_KEYS.buyers, JSON.stringify(buyers));
            localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
            localStorage.setItem(STORAGE_KEYS.employees, JSON.stringify(employees));
            localStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(attendance));
            localStorage.setItem(STORAGE_KEYS.salaryPayments, JSON.stringify(salaryPayments));
            localStorage.setItem(STORAGE_KEYS.payments, JSON.stringify(payments));
            localStorage.setItem(STORAGE_KEYS.invoiceDrafts, JSON.stringify(invoiceDrafts));
            localStorage.setItem(STORAGE_KEYS.activeInvoiceDraftIndex, JSON.stringify(activeInvoiceDraftIndex));
        }
    }, [products, invoices, buyers, expenses, employees, attendance, salaryPayments, payments, invoiceDrafts, activeInvoiceDraftIndex, isAppDataLoading]);

    const value = useMemo(() => ({
        products, setProducts,
        invoices, setInvoices,
        buyers, setBuyers,
        expenses, setExpenses,
        employees, setEmployees,
        attendance, setAttendance,
        salaryPayments, setSalaryPayments,
        payments, setPayments,
        invoiceDrafts, setInvoiceDrafts,
        activeInvoiceDraftIndex, setActiveInvoiceDraftIndex,
        isAppDataLoading
    }), [
        products, invoices, buyers, expenses, employees, attendance, salaryPayments, payments, invoiceDrafts, activeInvoiceDraftIndex, isAppDataLoading
    ]);

    return (
        <AppDataContext.Provider value={value}>
            {children}
        </AppDataContext.Provider>
    );
}

export function useAppData() {
    const context = useContext(AppDataContext);
    if (context === undefined) {
        throw new Error('useAppData must be used within a DataProvider');
    }
    return context;
}

    