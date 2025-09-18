
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import type { Product, Invoice, Buyer, Expense, Employee, Attendance, SalaryPayment, Payment, AttendanceStatus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import type { DraftInvoice } from './use-invoice-form';
import { isSameDay, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { useSettings } from './use-settings';
import * as productActions from '@/lib/actions/product-actions';

const STORAGE_KEYS = {
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


interface AppDataContextType {
    products: Product[];
    invoices: Invoice[];
    buyers: Buyer[];
    expenses: Expense[];
    employees: Employee[];
    attendance: Attendance[];
    salaryPayments: SalaryPayment[];
    payments: Payment[];
    invoiceDrafts: DraftInvoice[];
    activeInvoiceDraftIndex: number;
    isAppDataLoading: boolean;
    
    // Product Functions
    addProduct: (product: Omit<Product, 'id' | 'sellingPrice'>) => Promise<void>;
    addMultipleProducts: (products: Omit<Product, 'id'|'sellingPrice'>[]) => Promise<void>;
    updateProduct: (productId: string, updatedData: Omit<Product, 'id' | 'sellingPrice'>) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;
    getProductById: (productId: string) => Product | undefined;

    // Invoice & Buyer Functions
    saveAndPrintInvoice: (draftInvoice: DraftInvoice) => Promise<boolean>;
    updateInvoiceDue: (invoiceId: string, amountPaid: number) => void;
    getInvoicesForBuyer: (buyerId: string) => Invoice[];
    getInvoicesForDateRange: (startDate: Date, endDate: Date) => Invoice[];

    // Payment Functions
    addPayment: (payment: Omit<Payment, 'id' | 'date'>) => void;
    getPaymentsForInvoice: (invoiceId: string) => Payment[];

    // Expense Functions
    addExpense: (expense: Omit<Expense, 'id'>) => void;
    updateExpense: (expenseId: string, updatedData: Omit<Expense, 'id'>) => void;
    deleteExpense: (expenseId: string) => void;
    getExpensesForDateRange: (startDate: Date, endDate: Date) => Expense[];
    
    // Employee Functions
    addEmployee: (employee: Omit<Employee, 'id'>) => void;
    updateEmployee: (employeeId: string, updatedData: Omit<Employee, 'id'>) => void;
    deleteEmployee: (employeeId: string) => void;
    markAttendance: (employeeId: string, date: Date, status: AttendanceStatus) => void;
    getAttendanceForDate: (date: Date) => Attendance[];
    getAttendanceSummaryForDate: (date: Date) => { present: number; absent: number; leave: number; total: number };

    // Salary Functions
    addSalaryPayment: (payment: Omit<SalaryPayment, 'id'>) => void;
    getPaymentsForMonth: (employeeId: string, date: Date) => SalaryPayment[];
    getDueSalaryForMonth: (employee: Employee, date: Date) => number;

    // Invoice Form Functions
    setInvoiceDrafts: React.Dispatch<React.SetStateAction<DraftInvoice[]>>;
    setActiveInvoiceDraftIndex: React.Dispatch<React.SetStateAction<number>>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

async function printPosReceipt(settings: any, orderData: any) {
    const printerConfig = {
        type: settings.posPrinterType,
        options: {
            host: settings.posPrinterHost,
            port: settings.posPrinterPort,
        }
    };
    const response = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printer: printerConfig, data: orderData }),
    });
    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'An unknown error occurred during printing.');
    }
}

function printNormalReceipt(): Promise<boolean> {
    return new Promise(resolve => {
        document.body.classList.add('printing');
        const handleAfterPrint = () => {
            document.body.classList.remove('printing');
            window.removeEventListener('afterprint', handleAfterPrint);
            resolve(true);
        };
        window.addEventListener('afterprint', handleAfterPrint);
        window.print();
    });
}

export function DataProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const { settings } = useSettings();

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

    const loadServerData = useCallback(async () => {
        try {
            const serverProducts = await productActions.getAllProducts();
            setProducts(serverProducts);
        } catch (error) {
            console.error("Failed to load products from server:", error);
            toast({ variant: 'destructive', title: 'Database Error', description: 'Could not connect to the database.' });
        }
    }, []);

    useEffect(() => {
        async function loadAllData() {
            setIsAppDataLoading(true);
            try {
                // Load DB data
                await loadServerData();

                // Load localStorage data
                const localDataKeys: (keyof typeof STORAGE_KEYS)[] = [
                    'invoices', 'buyers', 'expenses', 'employees', 'attendance', 
                    'salaryPayments', 'payments', 'invoiceDrafts', 'activeInvoiceDraftIndex'
                ];
                
                const data: { [key: string]: any } = {};
                localDataKeys.forEach(key => {
                    data[key] = JSON.parse(localStorage.getItem(STORAGE_KEYS[key]) || 'null');
                });

                setInvoices(data.invoices || []);
                setBuyers(data.buyers || []);
                setExpenses(data.expenses || []);
                setEmployees(data.employees || []);
                setAttendance(data.attendance || []);
                setSalaryPayments(data.salaryPayments || []);
                setPayments(data.payments || []);
                setInvoiceDrafts(data.invoiceDrafts && data.invoiceDrafts.length > 0 ? data.invoiceDrafts : [createNewDraft()]);
                setActiveInvoiceDraftIndex(data.activeInvoiceDraftIndex || 0);

            } catch (error) {
                console.error("Failed to load app data", error);
                toast({ variant: 'destructive', title: 'Loading Error', description: 'Failed to load application data.' });
            } finally {
                setIsAppDataLoading(false);
            }
        }
        loadAllData();
    }, [toast, loadServerData]);

    useEffect(() => {
        if (!isAppDataLoading) {
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
    }, [invoices, buyers, expenses, employees, attendance, salaryPayments, payments, invoiceDrafts, activeInvoiceDraftIndex, isAppDataLoading]);

    const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'sellingPrice'>) => {
        try {
            await productActions.addProduct(productData);
            await loadServerData();
            toast({ title: "Product Added", description: `${productData.name} has been added.` });
        } catch (error) {
            console.error("Failed to add product:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add product.' });
        }
    }, [toast, loadServerData]);

    const addMultipleProducts = useCallback(async (productsData: Omit<Product, 'id' | 'sellingPrice'>[]) => {
        try {
            await productActions.addMultipleProducts(productsData);
            await loadServerData();
            toast({ title: "Upload Successful", description: `${productsData.length} products have been added.` });
        } catch (error) {
             console.error("Failed to add multiple products:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add products in bulk.' });
        }
    }, [toast, loadServerData]);

    const updateProduct = useCallback(async (productId: string, updatedData: Omit<Product, 'id' | 'sellingPrice'>) => {
        try {
            await productActions.updateProduct(productId, updatedData);
            await loadServerData();
            toast({ title: "Product Updated", description: `Details for ${updatedData.name} have been updated.` });
        } catch (error) {
            console.error("Failed to update product:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update product.' });
        }
    }, [toast, loadServerData]);

    const deleteProduct = useCallback(async (productId: string) => {
        try {
            await productActions.deleteProduct(productId);
            await loadServerData();
            toast({ title: "Product Deleted", description: `The product has been removed.` });
        } catch (error) {
             console.error("Failed to delete product:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete product.' });
        }
    }, [toast, loadServerData]);

    const getProductById = useCallback((productId: string) => products.find(p => p.id === productId), [products]);

    const saveAndPrintInvoice = useCallback(async (draftInvoice: DraftInvoice): Promise<boolean> => {
        const newId = `INV-${Date.now()}`;
        
        let buyerId = draftInvoice.buyerId || '';
        const existingBuyer = buyers.find(b => b.name === draftInvoice.customerName && b.phone === draftInvoice.customerPhone);
        if (existingBuyer) {
            buyerId = existingBuyer.id;
            setBuyers(prev => prev.map(b => b.id === buyerId ? { ...b, invoiceIds: [...b.invoiceIds, newId] } : b));
        } else if (draftInvoice.customerName) {
            buyerId = `buyer-${Date.now()}`;
            const newBuyer: Buyer = { id: buyerId, name: draftInvoice.customerName, address: draftInvoice.customerAddress, phone: draftInvoice.customerPhone, invoiceIds: [newId] };
            setBuyers(prev => [...prev, newBuyer]);
        }

        const invoiceToSave: Invoice = {
          id: newId,
          buyerId: buyerId,
          customerName: draftInvoice.customerName,
          customerAddress: draftInvoice.customerAddress,
          customerPhone: draftInvoice.customerPhone,
          items: draftInvoice.items.map(({ originalPrice, ...item }) => item),
          subtotal: draftInvoice.subtotal,
          paidAmount: draftInvoice.paidAmount,
          dueAmount: draftInvoice.dueAmount,
          date: new Date().toISOString(),
        };
        setInvoices(prev => [invoiceToSave, ...prev]);

        // Update product stock
        const stockUpdates = draftInvoice.items.map(item => ({
            id: item.id,
            stockChange: -item.quantity,
        }));
        
        try {
            await productActions.updateMultipleStocks(stockUpdates);
            await loadServerData(); // Refresh product list with new stock
        } catch (error) {
            console.error("Failed to update product stock after invoice creation:", error);
            // Optionally revert invoice creation or show a warning
        }


        if (settings.printFormat === 'pos' && settings.posPrinterType !== 'disabled') {
            const orderData = { orderId: newId, customerName: draftInvoice.customerName, items: draftInvoice.items, subtotal: draftInvoice.subtotal, tax: 0, total: draftInvoice.subtotal };
            await printPosReceipt(settings, orderData);
            return true;
        } else {
            return await printNormalReceipt();
        }
    }, [settings, buyers, loadServerData]);

    const updateInvoiceDue = useCallback((invoiceId: string, amountPaid: number) => {
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, paidAmount: inv.paidAmount + amountPaid, dueAmount: inv.dueAmount - amountPaid } : inv));
    }, []);

    const getInvoicesForBuyer = useCallback((buyerId: string) => {
        const buyer = buyers.find(b => b.id === buyerId);
        if (!buyer) return [];
        return invoices.filter(inv => buyer.invoiceIds.includes(inv.id)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [buyers, invoices]);

    const getInvoicesForDateRange = useCallback((startDate: Date, endDate: Date) => {
        return invoices.filter(inv => isWithinInterval(new Date(inv.date), { start: startDate, end: endDate }));
    }, [invoices]);

    const addPayment = useCallback((paymentData: Omit<Payment, 'id' | 'date'>) => {
        const newPayment: Payment = { ...paymentData, id: `pay-${Date.now()}`, date: new Date().toISOString() };
        setPayments(prev => [...prev, newPayment]);
        updateInvoiceDue(paymentData.invoiceId, paymentData.amount);
    }, [updateInvoiceDue]);

    const getPaymentsForInvoice = useCallback((invoiceId: string) => {
        return payments.filter(p => p.invoiceId === invoiceId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [payments]);

    const addExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
        const newExpense: Expense = { ...expenseData, id: `exp-${Date.now()}` };
        setExpenses(prev => [newExpense, ...prev]);
        toast({ title: "Expense Added", description: `New expense of ৳${expenseData.amount} has been recorded.` });
    }, [toast]);

    const updateExpense = useCallback((expenseId: string, updatedData: Omit<Expense, 'id'>) => {
        setExpenses(prev => prev.map(e => (e.id === expenseId ? { id: expenseId, ...updatedData } : e)));
        toast({ title: "Expense Updated", description: "The expense details have been updated." });
    }, [toast]);

    const deleteExpense = useCallback((expenseId: string) => {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
        toast({ title: "Expense Deleted", description: "The expense record has been removed." });
    }, [toast]);
    
    const getExpensesForDateRange = useCallback((startDate: Date, endDate: Date) => {
        return expenses.filter(exp => isWithinInterval(new Date(exp.date), { start: startDate, end: endDate }));
    }, [expenses]);

    const addEmployee = useCallback((employeeData: Omit<Employee, 'id'>) => {
        const newEmployee: Employee = { ...employeeData, id: `emp-${Date.now()}` };
        setEmployees(prev => [newEmployee, ...prev]);
        toast({ title: "Employee Added", description: `${newEmployee.name} has been added.` });
    }, [toast]);

    const updateEmployee = useCallback((employeeId: string, updatedData: Omit<Employee, 'id'>) => {
        setEmployees(prev => prev.map(e => (e.id === employeeId ? { id: employeeId, ...updatedData } : e)));
        toast({ title: "Employee Updated", description: "The employee details have been updated." });
    }, [toast]);

    const deleteEmployee = useCallback((employeeId: string) => {
        setEmployees(prev => prev.filter(e => e.id !== employeeId));
        toast({ title: "Employee Deleted", description: "The employee record has been removed." });
    }, [toast]);

    const markAttendance = useCallback((employeeId: string, date: Date, status: AttendanceStatus) => {
        setAttendance(prev => {
            const dateString = date.toISOString().split('T')[0];
            const existingRecord = prev.find(a => a.employeeId === employeeId && a.date.startsWith(dateString));
            if (existingRecord) {
                return prev.map(a => a.id === existingRecord.id ? { ...a, status } : a);
            } else {
                return [...prev, { id: `att-${Date.now()}`, employeeId, date: date.toISOString(), status }];
            }
        });
    }, []);

    const getAttendanceForDate = useCallback((date: Date) => {
        return attendance.filter(a => isSameDay(new Date(a.date), date));
    }, [attendance]);

    const getAttendanceSummaryForDate = useCallback((date: Date) => {
        const dailyRecords = getAttendanceForDate(date);
        const present = dailyRecords.filter(a => a.status === 'Present').length;
        const leave = dailyRecords.filter(a => a.status === 'Leave').length;
        const absent = employees.length - present - leave;
        return { present, absent, leave, total: employees.length };
    }, [getAttendanceForDate, employees.length]);

    const addSalaryPayment = useCallback((paymentData: Omit<SalaryPayment, 'id'>) => {
        const newPayment: SalaryPayment = { ...paymentData, id: `sal-${Date.now()}` };
        setSalaryPayments(prev => [newPayment, ...prev]);
    }, []);

    const getPaymentsForMonth = useCallback((employeeId: string, date: Date) => {
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        return salaryPayments.filter(p => p.employeeId === employeeId && isWithinInterval(new Date(p.date), { start: monthStart, end: monthEnd }));
    }, [salaryPayments]);

    const getDueSalaryForMonth = useCallback((employee: Employee, date: Date) => {
        if (!employee) return 0;
        const totalPaid = getPaymentsForMonth(employee.id, date).reduce((sum, p) => sum + p.amount, 0);
        return employee.salary - totalPaid;
    }, [getPaymentsForMonth]);

    const value = useMemo(() => ({
        products, invoices, buyers, expenses, employees, attendance, salaryPayments, payments, invoiceDrafts, activeInvoiceDraftIndex, isAppDataLoading,
        addProduct, addMultipleProducts, updateProduct, deleteProduct, getProductById,
        saveAndPrintInvoice, updateInvoiceDue, getInvoicesForBuyer, getInvoicesForDateRange,
        addPayment, getPaymentsForInvoice,
        addExpense, updateExpense, deleteExpense, getExpensesForDateRange,
        addEmployee, updateEmployee, deleteEmployee, markAttendance, getAttendanceForDate, getAttendanceSummaryForDate,
        addSalaryPayment, getPaymentsForMonth, getDueSalaryForMonth,
        setInvoiceDrafts, setActiveInvoiceDraftIndex
    }), [
        products, invoices, buyers, expenses, employees, attendance, salaryPayments, payments, invoiceDrafts, activeInvoiceDraftIndex, isAppDataLoading,
        addProduct, addMultipleProducts, updateProduct, deleteProduct, getProductById,
        saveAndPrintInvoice, updateInvoiceDue, getInvoicesForBuyer, getInvoicesForDateRange,
        addPayment, getPaymentsForInvoice,
        addExpense, updateExpense, deleteExpense, getExpensesForDateRange,
        addEmployee, updateEmployee, deleteEmployee, markAttendance, getAttendanceForDate, getAttendanceSummaryForDate,
        addSalaryPayment, getPaymentsForMonth, getDueSalaryForMonth,
        setInvoiceDrafts, setActiveInvoiceDraftIndex
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
