
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import type { Product, Invoice, Buyer, Expense, Employee, Attendance, SalaryPayment, Payment, AttendanceStatus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import type { DraftInvoice } from './use-invoice-form';
import { isSameDay, isWithinInterval, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { useSettings } from './use-settings';
import * as productActions from '@/lib/actions/product-actions';
import * as dataActions from '@/lib/actions/data-actions';

const STORAGE_KEYS = {
    products: 'stockpilot-products',
    invoices: 'stockpilot-invoices',
    buyers: 'stockpilot-buyers',
    expenses: 'stockpilot-expenses',
    employees: 'stockpilot-employees',
    attendance: 'stockpilot-attendance',
    salaryPayments: 'stockpilot-salary-payments',
    payments: 'stockpilot-payments',
    lastInvoiceNumber: 'stockpilot-last-invoice-number',
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
            } else {
                // Load all data from localStorage
                Object.keys(STORAGE_KEYS).forEach(key => {
                    const savedData = localStorage.getItem(STORAGE_KEYS[key as keyof typeof STORAGE_KEYS]);
                    if (savedData) {
                        try {
                            const parsedData = JSON.parse(savedData);
                            switch (key) {
                                case 'products': setProducts(parsedData || []); break;
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

    const usePersistedState = <T,>(key: keyof typeof STORAGE_KEYS, state: T) => {
        useEffect(() => {
            if (!isAppDataLoading && !isDbConnected) {
                localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(state));
            }
        }, [state]);
    };
    
    usePersistedState('products', products);
    usePersistedState('invoices', invoices);
    usePersistedState('buyers', buyers);
    usePersistedState('expenses', expenses);
    usePersistedState('employees', employees);
    usePersistedState('attendance', attendance);
    usePersistedState('salaryPayments', salaryPayments);
    usePersistedState('payments', payments);
    
    // --- Generic Add/Update/Delete handlers for local state ---
    const localAdd = <T extends {id: any}>(setter: React.Dispatch<React.SetStateAction<T[]>>, item: T) => setter(prev => [item, ...prev]);
    const localUpdate = <T extends {id: any}>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: any, updatedItem: T) => setter(prev => prev.map(i => i.id === id ? updatedItem : i));
    const localDelete = <T extends {id: any}>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: any) => setter(prev => prev.filter(i => i.id !== id));

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
        
        let newInvoice: Invoice;
        if (isDbConnected) {
             newInvoice = await dataActions.addInvoice(invoiceToSave, invoiceToSave.items);
             await loadAllData();
        } else {
             const lastId = invoices.reduce((max, i) => Math.max(i.id, max), 0);
             newInvoice = { ...invoiceToSave, id: lastId + 1};
             
             let buyerId = draftInvoice.buyerId || '';
             const existingBuyer = buyers.find(b => b.name === draftInvoice.customerName && b.phone === draftInvoice.customerPhone);
             if (existingBuyer) {
                 buyerId = existingBuyer.id;
                 setBuyers(prev => prev.map(b => b.id === buyerId ? { ...b, invoiceIds: [...b.invoiceIds, String(newInvoice.id)] } : b));
             } else if (draftInvoice.customerName) {
                 buyerId = `buyer-${Date.now()}`;
                 const newBuyer: Buyer = { id: buyerId, name: draftInvoice.customerName, address: draftInvoice.customerAddress, phone: draftInvoice.customerPhone, invoiceIds: [String(newInvoice.id)] };
                 setBuyers(prev => [...prev, newBuyer]);
             }
             setInvoices(prev => [newInvoice, ...prev]);
        }
        
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
    }, [isDbConnected, loadAllData, settings, invoices, buyers]);
    
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
        if (isDbConnected) {
            await dataActions.addPayment(paymentData);
            await loadAllData();
        } else {
             const newPayment: Payment = { ...paymentData, id: `pay-${Date.now()}`, date: new Date().toISOString() };
             setPayments(prev => [...prev, newPayment]);
             setInvoices(prev => prev.map(inv => 
                inv.id === paymentData.invoiceId 
                ? { ...inv, paidAmount: inv.paidAmount + paymentData.amount, dueAmount: inv.dueAmount - paymentData.amount } 
                : inv
             ));
        }
    }, [isDbConnected, loadAllData]);

    const getPaymentsForInvoice = useCallback((invoiceId: number) => {
        return payments.filter(p => p.invoiceId === invoiceId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [payments]);

    const addExpense = useCallback(async (expenseData: Omit<Expense, 'id'>) => {
        if (isDbConnected) {
            await dataActions.addExpense(expenseData);
        } else {
            const newExpense: Expense = { ...expenseData, id: `exp-${Date.now()}` };
            localAdd(setExpenses, newExpense);
        }
        await loadAllData();
        toast({ title: "Expense Added", description: `New expense of ৳${expenseData.amount} has been recorded.` });
    }, [toast, isDbConnected, loadAllData]);

    const updateExpense = useCallback(async (expenseId: string, updatedData: Omit<Expense, 'id'>) => {
        if(isDbConnected) {
            await dataActions.updateExpense(expenseId, updatedData);
        } else {
            localUpdate(setExpenses, expenseId, { id: expenseId, ...updatedData });
        }
        await loadAllData();
        toast({ title: "Expense Updated", description: "The expense details have been updated." });
    }, [toast, isDbConnected, loadAllData]);

    const deleteExpense = useCallback(async (expenseId: string) => {
        if(isDbConnected) {
            await dataActions.deleteExpense(expenseId);
        } else {
            localDelete(setExpenses, expenseId);
        }
        await loadAllData();
        toast({ title: "Expense Deleted", description: "The expense record has been removed." });
    }, [toast, isDbConnected, loadAllData]);
    
    const getExpensesForDateRange = useCallback((startDate: Date, endDate: Date) => {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);
        return expenses.filter(exp => isWithinInterval(new Date(exp.date), { start, end }));
    }, [expenses]);

    const addEmployee = useCallback(async (employeeData: Omit<Employee, 'id'>) => {
        if (isDbConnected) {
            await dataActions.addEmployee(employeeData);
        } else {
            const newEmployee: Employee = { ...employeeData, id: `emp-${Date.now()}` };
            localAdd(setEmployees, newEmployee);
        }
        await loadAllData();
        toast({ title: "Employee Added", description: `${employeeData.name} has been added.` });
    }, [toast, isDbConnected, loadAllData]);

    const updateEmployee = useCallback(async (employeeId: string, updatedData: Omit<Employee, 'id'>) => {
        if (isDbConnected) {
            await dataActions.updateEmployee(employeeId, updatedData);
        } else {
            localUpdate(setEmployees, employeeId, { id: employeeId, ...updatedData });
        }
        await loadAllData();
        toast({ title: "Employee Updated", description: "The employee details have been updated." });
    }, [toast, isDbConnected, loadAllData]);

    const deleteEmployee = useCallback(async (employeeId: string) => {
        if (isDbConnected) {
            await dataActions.deleteEmployee(employeeId);
        } else {
            localDelete(setEmployees, employeeId);
        }
        await loadAllData();
        toast({ title: "Employee Deleted", description: "The employee record has been removed." });
    }, [toast, isDbConnected, loadAllData]);

    const markAttendance = useCallback(async (employeeId: string, date: Date, status: AttendanceStatus) => {
        const attendanceData = { employeeId, date: date.toISOString(), status };
        if (isDbConnected) {
            await dataActions.markAttendance(attendanceData);
        } else {
            const dateString = date.toISOString().split('T')[0];
            const existingRecord = attendance.find(a => a.employeeId === employeeId && a.date.startsWith(dateString));
            if (existingRecord) {
                localUpdate(setAttendance, existingRecord.id, { ...existingRecord, status });
            } else {
                localAdd(setAttendance, { ...attendanceData, id: `att-${Date.now()}`});
            }
        }
        await loadAllData();
    }, [isDbConnected, loadAllData, attendance]);

    const getAttendanceForDate = useCallback((date: Date) => {
        return attendance.filter(a => isSameDay(new Date(a.date), date));
    }, [attendance]);

    const addSalaryPayment = useCallback(async (paymentData: Omit<SalaryPayment, 'id'>) => {
        if (isDbConnected) {
            await dataActions.addSalaryPayment(paymentData);
        } else {
             const newPayment: SalaryPayment = { ...paymentData, id: `sal-${Date.now()}` };
             localAdd(setSalaryPayments, newPayment);
        }
        await loadAllData();
    }, [isDbConnected, loadAllData]);

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
        addInvoice, getBuyerById, getInvoicesForBuyer, getInvoicesForDateRange, getGrossProfitForDateRange,
        addPayment, getPaymentsForInvoice,
        addExpense, updateExpense, deleteExpense, getExpensesForDateRange,
        addEmployee, updateEmployee, deleteEmployee, markAttendance, getAttendanceForDate,
        addSalaryPayment, getPaymentsForMonth, getSalaryPaymentsForDateRange, getDueSalaryForMonth,
    }), [
        products, invoices, buyers, expenses, employees, attendance, salaryPayments, payments, isAppDataLoading, isDbConnected,
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
