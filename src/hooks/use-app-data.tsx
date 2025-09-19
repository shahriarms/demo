
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import type { Product, Invoice, Buyer, Expense, Employee, Attendance, SalaryPayment, Payment, AttendanceStatus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import type { DraftInvoice } from './use-invoice-form';
import { isSameDay, isWithinInterval, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { useSettings } from './use-settings';
import * as productActions from '@/lib/actions/product-actions';
import * as dataActions from '@/lib/actions/data-actions';

interface AppDataContextType {
    products: Product[];
    invoices: Invoice[];
    buyers: Buyer[];
    expenses: Expense[];
    employees: Employee[];
    attendance: Attendance[];
    salaryPayments: SalaryPayment[];
    payments: Payment[];
    isAppDataLoading: boolean;
    isDbConnected: boolean;
    lastInvoiceId: number;
    
    // Product Functions
    addProduct: (product: Omit<Product, 'id' | 'sellingPrice'>) => Promise<void>;
    addMultipleProducts: (products: Omit<Product, 'id'|'sellingPrice'>[]) => Promise<void>;
    updateProduct: (productId: string, updatedData: Omit<Product, 'id' | 'sellingPrice'>) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;
    getProductById: (productId: string) => Product | undefined;

    // Invoice & Buyer Functions
    addInvoice: (draftInvoice: DraftInvoice) => Promise<number | null>;
    getBuyerById: (buyerId: string) => Buyer | undefined;
    getInvoicesForBuyer: (buyerId: string) => Invoice[];
    getInvoicesForDateRange: (startDate: Date, endDate: Date) => Invoice[];
    getGrossProfitForDateRange: (invoices: Invoice[]) => number;


    // Payment Functions
    addPayment: (payment: Omit<Payment, 'id' | 'date'>) => Promise<void>;
    getPaymentsForInvoice: (invoiceId: number) => Payment[];

    // Expense Functions
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
    updateExpense: (expenseId: string, updatedData: Omit<Expense, 'id'>) => Promise<void>;
    deleteExpense: (expenseId: string) => Promise<void>;
    getExpensesForDateRange: (startDate: Date, endDate: Date) => Expense[];
    
    // Employee Functions
    addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
    updateEmployee: (employeeId: string, updatedData: Omit<Employee, 'id'>) => Promise<void>;
    deleteEmployee: (employeeId: string) => Promise<void>;
    markAttendance: (employeeId: string, date: Date, status: AttendanceStatus) => Promise<void>;
    getAttendanceForDate: (date: Date) => Attendance[];

    // Salary Functions
    addSalaryPayment: (payment: Omit<SalaryPayment, 'id'>) => Promise<void>;
    getPaymentsForMonth: (employeeId: string, startDate: Date, endDate: Date) => SalaryPayment[];
    getSalaryPaymentsForDateRange: (startDate: Date, endDate: Date) => SalaryPayment[];
    getDueSalaryForMonth: (employee: Employee, date: Date) => number;
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
    const [isAppDataLoading, setIsAppDataLoading] = useState(true);
    const [isDbConnected, setIsDbConnected] = useState(false);
    const [lastInvoiceId, setLastInvoiceId] = useState(0);

    const loadAllData = useCallback(async () => {
        setIsAppDataLoading(true);
        try {
            const isConnected = await productActions.checkDbConnection();
            setIsDbConnected(isConnected);

            if (isConnected) {
                const [serverProducts, serverData] = await Promise.all([
                    productActions.getAllProducts(),
                    dataActions.getAllData()
                ]);
                setProducts(serverProducts);
                setInvoices(serverData.invoices);
                setBuyers(serverData.buyers);
                setExpenses(serverData.expenses);
                setEmployees(serverData.employees);
                setAttendance(serverData.attendance);
                setSalaryPayments(serverData.salaryPayments);
                setPayments(serverData.payments);
                setLastInvoiceId(serverData.invoices[0]?.id || 0);
            } else {
                toast({ variant: 'destructive', title: 'Database not connected', description: 'Running in offline mode. Data will not be saved.' });
            }
        } catch (error) {
            console.error("Failed to load app data:", error);
            toast({ variant: 'destructive', title: 'Loading Error', description: 'Failed to load application data.' });
        } finally {
            setIsAppDataLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        loadAllData();
    }, [loadAllData]);
    
    const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'sellingPrice'>) => {
        try {
            await productActions.addProduct(productData);
            await loadAllData();
            toast({ title: "Product Added", description: `${productData.name} has been added.` });
        } catch (error) {
            console.error("Failed to add product:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add product.' });
        }
    }, [toast, loadAllData]);

    const addMultipleProducts = useCallback(async (productsData: Omit<Product, 'id' | 'sellingPrice'>[]) => {
        try {
            await productActions.addMultipleProducts(productsData);
            await loadAllData();
        } catch (error) {
             console.error("Failed to add multiple products:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add products in bulk.' });
        }
    }, [toast, loadAllData]);

    const updateProduct = useCallback(async (productId: string, updatedData: Omit<Product, 'id' | 'sellingPrice'>) => {
        try {
            await productActions.updateProduct(productId, updatedData);
            await loadAllData();
            toast({ title: "Product Updated", description: `Details for ${updatedData.name} have been updated.` });
        } catch (error) {
            console.error("Failed to update product:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update product.' });
        }
    }, [toast, loadAllData]);

    const deleteProduct = useCallback(async (productId: string) => {
        try {
            await productActions.deleteProduct(productId);
            await loadAllData();
            toast({ title: "Product Deleted", description: `The product has been removed.` });
        } catch (error) {
             console.error("Failed to delete product:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete product.' });
        }
    }, [toast, loadAllData]);

    const getProductById = useCallback((productId: string) => products.find(p => p.id === productId), [products]);

    const addInvoice = useCallback(async (draftInvoice: DraftInvoice): Promise<number | null> => {
        const invoiceToSave: Omit<Invoice, 'id'> = {
          buyerId: draftInvoice.buyerId,
          customerName: draftInvoice.customerName,
          customerAddress: draftInvoice.customerAddress,
          customerPhone: draftInvoice.customerPhone,
          items: draftInvoice.items.map(({ originalPrice, ...item }) => item),
          subtotal: draftInvoice.subtotal,
          paidAmount: draftInvoice.paidAmount,
          dueAmount: draftInvoice.dueAmount,
          date: new Date().toISOString(),
        };
        
        if (!isDbConnected) {
            toast({ variant: 'destructive', title: 'Offline Mode', description: 'Cannot save invoice while offline.'});
            return null;
        }
        
        const newInvoice = await dataActions.addInvoice(invoiceToSave, invoiceToSave.items);
        await loadAllData();
        
        if (settings.printFormat === 'pos' && settings.posPrinterType !== 'disabled') {
            const orderData = { orderId: newInvoice.id, customerName: draftInvoice.customerName, items: draftInvoice.items, subtotal: draftInvoice.subtotal, tax: 0, total: draftInvoice.subtotal };
            try {
                await printPosReceipt(settings, orderData);
            } catch(e) {
                console.error("POS printing failed:", e);
                throw e;
            }
        }
        
        return newInvoice.id;
    }, [isDbConnected, loadAllData, settings, toast]);
    
    const getBuyerById = useCallback((buyerId: string) => buyers.find(b => b.id === buyerId), [buyers]);

    const getInvoicesForBuyer = useCallback((buyerId: string) => {
        return invoices.filter(inv => inv.buyerId === buyerId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices]);

    const getInvoicesForDateRange = useCallback((startDate: Date, endDate: Date) => {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);
        return invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return isWithinInterval(invDate, { start, end });
        });
    }, [invoices]);
    
    const getGrossProfitForDateRange = useCallback((invoicesInRange: Invoice[]) => {
        let totalProfit = 0;
        const productMap = new Map(products.map(p => [p.id, p]));

        for (const invoice of invoicesInRange) {
            for (const item of invoice.items) {
                const product = productMap.get(item.id);
                if (product) {
                    const profitPerUnit = item.price - product.buyingPrice;
                    totalProfit += profitPerUnit * item.quantity;
                }
            }
        }
        return totalProfit;
    }, [products]);


    const addPayment = useCallback(async (paymentData: Omit<Payment, 'id' | 'date'>) => {
        if (!isDbConnected) {
             toast({ variant: 'destructive', title: 'Offline Mode', description: 'Cannot process payment while offline.'});
             return;
        }
        await dataActions.addPayment(paymentData);
        await loadAllData();
    }, [isDbConnected, loadAllData, toast]);

    const getPaymentsForInvoice = useCallback((invoiceId: number) => {
        return payments.filter(p => p.invoiceId === invoiceId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [payments]);

    const addExpense = useCallback(async (expenseData: Omit<Expense, 'id'>) => {
        if (!isDbConnected) {
             toast({ variant: 'destructive', title: 'Offline Mode', description: 'Cannot add expense while offline.'});
             return;
        }
        await dataActions.addExpense(expenseData);
        await loadAllData();
        toast({ title: "Expense Added", description: `New expense of ৳${expenseData.amount} has been recorded.` });
    }, [toast, isDbConnected, loadAllData]);

    const updateExpense = useCallback(async (expenseId: string, updatedData: Omit<Expense, 'id'>) => {
        if(!isDbConnected) {
            toast({ variant: 'destructive', title: 'Offline Mode', description: 'Cannot update expense while offline.'});
            return;
        }
        await dataActions.updateExpense(expenseId, updatedData);
        await loadAllData();
        toast({ title: "Expense Updated", description: "The expense details have been updated." });
    }, [toast, isDbConnected, loadAllData]);

    const deleteExpense = useCallback(async (expenseId: string) => {
        if(!isDbConnected) {
            toast({ variant: 'destructive', title: 'Offline Mode', description: 'Cannot delete expense while offline.'});
            return;
        }
        await dataActions.deleteExpense(expenseId);
        await loadAllData();
        toast({ title: "Expense Deleted", description: "The expense record has been removed." });
    }, [toast, isDbConnected, loadAllData]);
    
    const getExpensesForDateRange = useCallback((startDate: Date, endDate: Date) => {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);
        return expenses.filter(exp => isWithinInterval(new Date(exp.date), { start, end }));
    }, [expenses]);

    const addEmployee = useCallback(async (employeeData: Omit<Employee, 'id'>) => {
        if (!isDbConnected) {
             toast({ variant: 'destructive', title: 'Offline Mode', description: 'Cannot add employee while offline.'});
             return;
        }
        await dataActions.addEmployee(employeeData);
        await loadAllData();
        toast({ title: "Employee Added", description: `${employeeData.name} has been added.` });
    }, [toast, isDbConnected, loadAllData]);

    const updateEmployee = useCallback(async (employeeId: string, updatedData: Omit<Employee, 'id'>) => {
        if (!isDbConnected) {
             toast({ variant: 'destructive', title: 'Offline Mode', description: 'Cannot update employee while offline.'});
             return;
        }
        await dataActions.updateEmployee(employeeId, updatedData);
        await loadAllData();
        toast({ title: "Employee Updated", description: "The employee details have been updated." });
    }, [toast, isDbConnected, loadAllData]);

    const deleteEmployee = useCallback(async (employeeId: string) => {
        if (!isDbConnected) {
             toast({ variant: 'destructive', title: 'Offline Mode', description: 'Cannot delete employee while offline.'});
             return;
        }
        await dataActions.deleteEmployee(employeeId);
        await loadAllData();
        toast({ title: "Employee Deleted", description: "The employee record has been removed." });
    }, [toast, isDbConnected, loadAllData]);

    const markAttendance = useCallback(async (employeeId: string, date: Date, status: AttendanceStatus) => {
        const attendanceData = { employeeId, date: date.toISOString(), status };
        if (!isDbConnected) {
             toast({ variant: 'destructive', title: 'Offline Mode', description: 'Cannot mark attendance while offline.'});
             return;
        }
        await dataActions.markAttendance(attendanceData);
        await loadAllData();
    }, [isDbConnected, loadAllData, toast]);

    const getAttendanceForDate = useCallback((date: Date) => {
        return attendance.filter(a => isSameDay(new Date(a.date), date));
    }, [attendance]);

    const addSalaryPayment = useCallback(async (paymentData: Omit<SalaryPayment, 'id'>) => {
        if (!isDbConnected) {
             toast({ variant: 'destructive', title: 'Offline Mode', description: 'Cannot process salary while offline.'});
             return;
        }
        await dataActions.addSalaryPayment(paymentData);
        await loadAllData();
    }, [isDbConnected, loadAllData, toast]);

    const getPaymentsForMonth = useCallback((employeeId: string, startDate: Date, endDate: Date) => {
        return salaryPayments.filter(p => 
            p.employeeId === employeeId && 
            isWithinInterval(new Date(p.date), { start: startOfMonth(startDate), end: endOfMonth(endDate) })
        );
    }, [salaryPayments]);
    
    const getSalaryPaymentsForDateRange = useCallback((startDate: Date, endDate: Date) => {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);
        return salaryPayments.filter(p => isWithinInterval(new Date(p.date), { start, end }));
    }, [salaryPayments]);

    const getDueSalaryForMonth = useCallback((employee: Employee, date: Date) => {
        if (!employee) return 0;
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        const totalPaid = getPaymentsForMonth(employee.id, monthStart, monthEnd).reduce((sum, p) => sum + p.amount, 0);
        return employee.salary - totalPaid;
    }, [getPaymentsForMonth]);

    const value = useMemo(() => ({
        products, invoices, buyers, expenses, employees, attendance, salaryPayments, payments, isAppDataLoading, isDbConnected, lastInvoiceId,
        addProduct, addMultipleProducts, updateProduct, deleteProduct, getProductById,
        addInvoice, getBuyerById, getInvoicesForBuyer, getInvoicesForDateRange, getGrossProfitForDateRange,
        addPayment, getPaymentsForInvoice,
        addExpense, updateExpense, deleteExpense, getExpensesForDateRange,
        addEmployee, updateEmployee, deleteEmployee, markAttendance, getAttendanceForDate,
        addSalaryPayment, getPaymentsForMonth, getSalaryPaymentsForDateRange, getDueSalaryForMonth,
    }), [
        products, invoices, buyers, expenses, employees, attendance, salaryPayments, payments, isAppDataLoading, isDbConnected, lastInvoiceId,
        addProduct, addMultipleProducts, updateProduct, deleteProduct, getProductById,
        addInvoice, getBuyerById, getInvoicesForBuyer, getInvoicesForDateRange, getGrossProfitForDateRange,
        addPayment, getPaymentsForInvoice,
        addExpense, updateExpense, deleteExpense, getExpensesForDateRange,
        addEmployee, updateEmployee, deleteEmployee, markAttendance, getAttendanceForDate,
        addSalaryPayment, getPaymentsForMonth, getSalaryPaymentsForDateRange, getDueSalaryForMonth
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
