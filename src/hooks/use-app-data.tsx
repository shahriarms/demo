
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import type { Product, Invoice, Buyer, Expense, Employee, Attendance, SalaryPayment, Payment, AttendanceStatus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import type { DraftInvoice } from './use-invoice-form';
import { isSameDay, isWithinInterval, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { useSettings } from './use-settings';
import * as productActions from '@/lib/actions/product-actions';

const STORAGE_KEYS = {
    // Products are no longer in local storage
    invoices: 'stockpilot-invoices',
    buyers: 'stockpilot-buyers',
    expenses: 'stockpilot-expenses',
    employees: 'stockpilot-employees',
    attendance: 'stockpilot-attendance',
    salaryPayments: 'stockpilot-salary-payments',
    payments: 'stockpilot-payments',
};

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
    getGrossProfitForDateRange: (invoices: Invoice[]) => number;


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

function printNormalReceipt(): Promise<boolean> {
    return new Promise(resolve => {
        const handleAfterPrint = () => {
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
    const [isAppDataLoading, setIsAppDataLoading] = useState(true);
    const [isDbConnected, setIsDbConnected] = useState(false);

    const loadServerData = useCallback(async () => {
        try {
            const isConnected = await productActions.checkDbConnection();
            setIsDbConnected(isConnected);
            if (isConnected) {
                const serverProducts = await productActions.getAllProducts();
                setProducts(serverProducts);
            }
        } catch (error) {
            console.error("Failed to load products from server:", error);
            setIsDbConnected(false); // Assume not connected on error
            toast({ variant: 'destructive', title: 'Database Error', description: 'Could not connect to the database.' });
        }
    }, [toast]);

    useEffect(() => {
        async function loadAllData() {
            setIsAppDataLoading(true);
            try {
                await loadServerData();

                const localDataKeys: (keyof typeof STORAGE_KEYS)[] = [
                    'invoices', 'buyers', 'expenses', 'employees', 'attendance', 
                    'salaryPayments', 'payments'
                ];
                
                localDataKeys.forEach(key => {
                    const savedData = localStorage.getItem(STORAGE_KEYS[key]);
                    if (savedData) {
                        try {
                            const parsedData = JSON.parse(savedData);
                             switch (key) {
                                case 'invoices': setInvoices(parsedData || []); break;
                                case 'buyers': setBuyers(parsedData || []); break;
                                case 'expenses': setExpenses(parsedData || []); break;
                                case 'employees': setEmployees(parsedData || []); break;
                                case 'attendance': setAttendance(parsedData || []); break;
                                case 'salaryPayments': setSalaryPayments(parsedData || []); break;
                                case 'payments': setPayments(parsedData || []); break;
                            }
                        } catch (e) {
                             console.error(`Failed to parse ${key} from localStorage`, e);
                        }
                    }
                });

            } catch (error) {
                console.error("Failed to load app data", error);
                toast({ variant: 'destructive', title: 'Loading Error', description: 'Failed to load application data.' });
            } finally {
                setIsAppDataLoading(false);
            }
        }
        loadAllData();
    }, [loadServerData, toast]);

    const usePersistedState = <T,>(key: keyof typeof STORAGE_KEYS, state: T) => {
        useEffect(() => {
            if (!isAppDataLoading) {
                localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(state));
            }
        }, [state]);
    };
    
    usePersistedState('invoices', invoices);
    usePersistedState('buyers', buyers);
    usePersistedState('expenses', expenses);
    usePersistedState('employees', employees);
    usePersistedState('attendance', attendance);
    usePersistedState('salaryPayments', salaryPayments);
    usePersistedState('payments', payments);

    const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'sellingPrice'>) => {
        try {
            await productActions.addProduct(productData);
            await loadServerData(); // Refetch data
            toast({ title: "Product Added", description: `${productData.name} has been added.` });
        } catch (error) {
            console.error("Failed to add product:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add product.' });
        }
    }, [toast, loadServerData]);

    const addMultipleProducts = useCallback(async (productsData: Omit<Product, 'id' | 'sellingPrice'>[]) => {
        try {
            await productActions.addMultipleProducts(productsData);
            await loadServerData(); // Refetch data
        } catch (error) {
             console.error("Failed to add multiple products:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add products in bulk.' });
        }
    }, [toast, loadServerData]);

    const updateProduct = useCallback(async (productId: string, updatedData: Omit<Product, 'id' | 'sellingPrice'>) => {
        try {
            await productActions.updateProduct(productId, updatedData);
            await loadServerData(); // Refetch data
            toast({ title: "Product Updated", description: `Details for ${updatedData.name} have been updated.` });
        } catch (error) {
            console.error("Failed to update product:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update product.' });
        }
    }, [toast, loadServerData]);

    const deleteProduct = useCallback(async (productId: string) => {
        try {
            await productActions.deleteProduct(productId);
            await loadServerData(); // Refetch data
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

        // Update product stock if connected to DB
        if (isDbConnected) {
            const stockUpdates = draftInvoice.items.map(item => ({
                id: item.id,
                stockChange: -item.quantity,
            }));
            
            try {
                await productActions.updateMultipleStocks(stockUpdates);
                await loadServerData(); // Refresh product list with new stock
            } catch (error) {
                console.error("Failed to update product stock after invoice creation:", error);
            }
        }

        if (settings.printFormat === 'pos' && settings.posPrinterType !== 'disabled') {
            const orderData = { orderId: newId, customerName: draftInvoice.customerName, items: draftInvoice.items, subtotal: draftInvoice.subtotal, tax: 0, total: draftInvoice.subtotal };
            await printPosReceipt(settings, orderData);
            return true;
        } else {
            return await printNormalReceipt();
        }
    }, [settings, buyers, loadServerData, isDbConnected]);

    const updateInvoiceDue = useCallback((invoiceId: string, amountPaid: number) => {
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, paidAmount: inv.paidAmount + amountPaid, dueAmount: inv.dueAmount - amountPaid } : inv));
    }, []);

    const getInvoicesForBuyer = useCallback((buyerId: string) => {
        const buyer = buyers.find(b => b.id === buyerId);
        if (!buyer) return [];
        return invoices.filter(inv => buyer.invoiceIds.includes(inv.id)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [buyers, invoices]);

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
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);
        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return isWithinInterval(expDate, { start, end });
        });
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
        products, invoices, buyers, expenses, employees, attendance, salaryPayments, payments, isAppDataLoading, isDbConnected,
        addProduct, addMultipleProducts, updateProduct, deleteProduct, getProductById,
        saveAndPrintInvoice, updateInvoiceDue, getInvoicesForBuyer, getInvoicesForDateRange, getGrossProfitForDateRange,
        addPayment, getPaymentsForInvoice,
        addExpense, updateExpense, deleteExpense, getExpensesForDateRange,
        addEmployee, updateEmployee, deleteEmployee, markAttendance, getAttendanceForDate, getAttendanceSummaryForDate,
        addSalaryPayment, getPaymentsForMonth, getSalaryPaymentsForDateRange, getDueSalaryForMonth,
    }), [
        products, invoices, buyers, expenses, employees, attendance, salaryPayments, payments, isAppDataLoading, isDbConnected,
        addProduct, addMultipleProducts, updateProduct, deleteProduct, getProductById,
        saveAndPrintInvoice, updateInvoiceDue, getInvoicesForBuyer, getInvoicesForDateRange, getGrossProfitForDateRange,
        addPayment, getPaymentsForInvoice,
        addExpense, updateExpense, deleteExpense, getExpensesForDateRange,
        addEmployee, updateEmployee, deleteEmployee, markAttendance, getAttendanceForDate, getAttendanceSummaryForDate,
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
