
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { Product, Invoice, Buyer, Expense, Employee, Attendance, SalaryPayment, Payment, AppSettings } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { isSameDay, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import type { DraftInvoice, DraftInvoiceItem } from './use-invoice-form';

// Initial data fallbacks
const initialProducts: Product[] = [
    { id: 'prod-1', name: 'Angel 1" 4mm', sku: 'ANG-1-4', buyingPrice: 8.4, profitMargin: 25, sellingPrice: 10.5, stock: 597, mainCategory: 'Material', category: 'Angel', subCategory: '28' },
    { id: 'prod-2', name: 'Angel 1" 5mm', sku: 'ANG-1-5', buyingPrice: 10.2, profitMargin: 25, sellingPrice: 12.75, stock: 847, mainCategory: 'Material', category: 'Angel', subCategory: '28' },
    { id: 'prod-15', name: 'Hammer 500g', sku: 'HMR-500', buyingPrice: 12, profitMargin: 25, sellingPrice: 15, stock: 50, mainCategory: 'Hardware', category: 'Tools', subCategory: 'Hand Tools' },
    { id: 'prod-16', name: 'Screwdriver Set', sku: 'SCR-SET-10', buyingPrice: 18, profitMargin: 25, sellingPrice: 22.5, stock: 75, mainCategory: 'Hardware', category: 'Tools', subCategory: 'Hand Tools' },
];
const initialEmployees: Employee[] = [
    { id: 'emp-1', name: 'Shahadat Hossain', phone: '01712345678', address: '123 Mirpur, Dhaka', role: 'Manager', salary: 35000, joiningDate: new Date(2023, 0, 15).toISOString() },
    { id: 'emp-2', name: 'Rabiul Islam', phone: '01812345679', address: '456 Gulshan, Dhaka', role: 'Sales', salary: 22000, joiningDate: new Date(2023, 5, 1).toISOString() },
    { id: 'emp-3', name: 'Mehedi Hasan', phone: '01912345680', address: '789 Banani, Dhaka', role: 'Worker', salary: 18000, joiningDate: new Date(2024, 2, 10).toISOString() },
];
const initialExpenses: Expense[] = [
    { id: 'exp-1', category: 'Rent', description: 'Office rent for July', amount: 1200, date: new Date(2024, 6, 1).toISOString(), paymentMethod: 'Bank' },
    { id: 'exp-2', category: 'Utility', description: 'Electricity Bill', amount: 150, date: new Date(2024, 6, 15).toISOString(), paymentMethod: 'bKash' },
];
const createNewDraft = (): DraftInvoice => ({
    id: `draft-${Date.now()}`,
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
    const [isAppDataLoading, setIsAppDataLoading] = useState(true);

    // Load all data from localStorage at once
    useEffect(() => {
        try {
            const data = {
                products: JSON.parse(localStorage.getItem(STORAGE_KEYS.products) || 'null') || initialProducts,
                invoices: JSON.parse(localStorage.getItem(STORAGE_KEYS.invoices) || '[]'),
                buyers: JSON.parse(localStorage.getItem(STORAGE_KEYS.buyers) || '[]'),
                expenses: JSON.parse(localStorage.getItem(STORAGE_KEYS.expenses) || 'null') || initialExpenses,
                employees: JSON.parse(localStorage.getItem(STORAGE_KEYS.employees) || 'null') || initialEmployees,
                attendance: JSON.parse(localStorage.getItem(STORAGE_KEYS.attendance) || '[]'),
                salaryPayments: JSON.parse(localStorage.getItem(STORAGE_KEYS.salaryPayments) || '[]'),
                payments: JSON.parse(localStorage.getItem(STORAGE_KEYS.payments) || '[]'),
                invoiceDrafts: JSON.parse(localStorage.getItem(STORAGE_KEYS.invoiceDrafts) || 'null') || [createNewDraft()],
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
        }
    }, [products, invoices, buyers, expenses, employees, attendance, salaryPayments, payments, invoiceDrafts, isAppDataLoading]);

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
        isAppDataLoading
    }), [
        products, invoices, buyers, expenses, employees, attendance, salaryPayments, payments, invoiceDrafts, isAppDataLoading
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
