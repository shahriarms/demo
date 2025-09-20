
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
    addPayment: (payment: Omit<Payment, 'id' | 'date'>) => Promise<Payment | null>;
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
const LOCAL_STORAGE_KEY = 'stockpilot-offline-data';

async function printPosReceipt(settings: any, orderData: any) {
    // For normal browser printing, just trigger the print dialog.
    if (settings.printFormat === 'normal' || settings.posPrinterType === 'disabled') {
        window.print();
        return;
    }

    // For direct-to-POS printing via the API route
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

const getOfflineData = () => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : { products: [], invoices: [], buyers: [], expenses: [], employees: [], attendance: [], salaryPayments: [], payments: [] };
};

const setOfflineData = (data: any) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};

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
                toast({ variant: 'destructive', title: 'Running in Offline Mode', description: 'Database not connected. Using local storage.' });
                const offlineData = getOfflineData();
                setProducts(offlineData.products || []);
                setInvoices(offlineData.invoices || []);
                setBuyers(offlineData.buyers || []);
                setExpenses(offlineData.expenses || []);
                setEmployees(offlineData.employees || []);
                setAttendance(offlineData.attendance || []);
                setSalaryPayments(offlineData.salaryPayments || []);
                setPayments(offlineData.payments || []);
                setLastInvoiceId(offlineData.invoices?.[0]?.id || 0);
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
        if (isDbConnected) {
            try {
                await productActions.addProduct(productData);
                await loadAllData();
                toast({ title: "Product Added", description: `${productData.name} has been added.` });
            } catch (error) {
                console.error("Failed to add product:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to add product.' });
            }
        } else {
            const sellingPrice = productData.buyingPrice + (productData.buyingPrice * productData.profitMargin / 100);
            const newProduct = { ...productData, sellingPrice, id: `prod-${Date.now()}`};
            const offlineData = getOfflineData();
            offlineData.products.push(newProduct);
            setOfflineData(offlineData);
            setProducts(offlineData.products);
            toast({ title: "Product Added (Offline)", description: `${newProduct.name} has been saved locally.` });
        }
    }, [isDbConnected, toast, loadAllData]);

    const addMultipleProducts = useCallback(async (productsData: Omit<Product, 'id' | 'sellingPrice'>[]) => {
        if(isDbConnected) {
            try {
                await productActions.addMultipleProducts(productsData);
                await loadAllData();
            } catch (error) {
                 console.error("Failed to add multiple products:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to add products in bulk.' });
            }
        } else {
             toast({ variant: 'destructive', title: 'Offline Mode', description: 'Bulk upload is not available offline.' });
        }
    }, [isDbConnected, toast, loadAllData]);

    const updateProduct = useCallback(async (productId: string, updatedData: Omit<Product, 'id' | 'sellingPrice'>) => {
        if (isDbConnected) {
            try {
                await productActions.updateProduct(productId, updatedData);
                await loadAllData();
                toast({ title: "Product Updated", description: `Details for ${updatedData.name} have been updated.` });
            } catch (error) {
                console.error("Failed to update product:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to update product.' });
            }
        } else {
            const offlineData = getOfflineData();
            const sellingPrice = updatedData.buyingPrice + (updatedData.buyingPrice * updatedData.profitMargin / 100);
            const productIndex = offlineData.products.findIndex((p: Product) => p.id === productId);
            if (productIndex !== -1) {
                offlineData.products[productIndex] = { ...offlineData.products[productIndex], ...updatedData, sellingPrice };
                setOfflineData(offlineData);
                setProducts(offlineData.products);
                toast({ title: "Product Updated (Offline)", description: `Details for ${updatedData.name} have been updated locally.` });
            }
        }
    }, [isDbConnected, toast, loadAllData]);

    const deleteProduct = useCallback(async (productId: string) => {
        if (isDbConnected) {
            try {
                await productActions.deleteProduct(productId);
                await loadAllData();
                toast({ title: "Product Deleted", description: `The product has been removed.` });
            } catch (error) {
                 console.error("Failed to delete product:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete product.' });
            }
        } else {
             const offlineData = getOfflineData();
            offlineData.products = offlineData.products.filter((p: Product) => p.id !== productId);
            setOfflineData(offlineData);
            setProducts(offlineData.products);
            toast({ title: "Product Deleted (Offline)" });
        }
    }, [isDbConnected, toast, loadAllData]);

    const getProductById = useCallback((productId: string) => products.find(p => p.id === productId), [products]);

    const addInvoice = useCallback(async (draftInvoice: DraftInvoice): Promise<number | null> => {
        const invoiceToSave: Omit<Invoice, 'id'> = {
          buyerId: draftInvoice.buyerId,
          customerName: draftInvoice.customerName,
          customerAddress: draftInvoice.customerAddress,
          customerPhone: draftInvoice.customerPhone,
          items: draftInvoice.items.map(({ originalPrice, ...item }) => item),
          subtotal: draftInvoice.subtotal,
          paidAmount: draftInvoice.paidAmount || 0,
          dueAmount: draftInvoice.dueAmount,
          date: new Date().toISOString(),
        };
        
        try {
            if (isDbConnected) {
                const newInvoice = await dataActions.addInvoice(invoiceToSave, invoiceToSave.items);
                await loadAllData();
                
                if (settings.printFormat === 'pos') {
                    const orderData = { orderId: newInvoice.id, customerName: draftInvoice.customerName, items: draftInvoice.items, subtotal: draftInvoice.subtotal, tax: 0, total: draftInvoice.subtotal };
                    try {
                        // This will now use the browser's print dialog for POS format
                        // Or attempt to print to a configured POS printer via the API route
                        await printPosReceipt(settings, orderData);
                    } catch(e: any) {
                        console.error("POS printing failed but invoice was saved:", e);
                        toast({ variant: 'destructive', title: 'Printing Failed', description: e.message || 'Invoice saved, but printing failed.' });
                    }
                }
                return newInvoice.id;
            } else {
                // Offline logic
                const offlineData = getOfflineData();
                const newId = (offlineData.invoices[0]?.id || 0) + 1;
                const newInvoice = { ...invoiceToSave, id: newId };

                // Update product stock
                newInvoice.items.forEach(item => {
                    const productIndex = offlineData.products.findIndex((p: Product) => p.id === item.id);
                    if (productIndex !== -1) {
                        offlineData.products[productIndex].stock -= item.quantity;
                    }
                });
                setProducts(offlineData.products);

                offlineData.invoices.unshift(newInvoice);
                setInvoices(offlineData.invoices);
                
                setOfflineData(offlineData);
                toast({ title: "Invoice Saved (Offline)", description: `Invoice #${newId} saved locally.` });

                 if (settings.printFormat === 'pos') {
                    // This will trigger window.print() in offline mode for POS format
                    await printPosReceipt(settings, {}); 
                }
                return newId;
            }
        } catch (error) {
            console.error("Failed to save invoice:", error);
            throw error; // Re-throw to be caught by the calling function
        }
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


    const addPayment = useCallback(async (paymentData: Omit<Payment, 'id' | 'date'>): Promise<Payment | null> => {
        if (isDbConnected) {
            try {
                const newPayment = await dataActions.addPayment(paymentData);
                // Manually update state for faster UI response
                setPayments(prev => [newPayment, ...prev]);
                setInvoices(prev => prev.map(inv => 
                    inv.id === newPayment.invoiceId 
                    ? { ...inv, paidAmount: inv.paidAmount + newPayment.amount, dueAmount: inv.dueAmount - newPayment.amount }
                    : inv
                ));
                return newPayment;
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Payment Error', description: error.message || "Failed to process payment."});
                return null;
            }
        } else {
             const offlineData = getOfflineData();
             const newId = `pay-${Date.now()}`;
             const newPayment = { ...paymentData, id: newId, date: new Date().toISOString() };
             offlineData.payments.unshift(newPayment);

             const invoiceIndex = offlineData.invoices.findIndex((i: Invoice) => i.id === newPayment.invoiceId);
             if(invoiceIndex !== -1) {
                offlineData.invoices[invoiceIndex].paidAmount += newPayment.amount;
                offlineData.invoices[invoiceIndex].dueAmount -= newPayment.amount;
             }
             setOfflineData(offlineData);
             setPayments(offlineData.payments);
             setInvoices(offlineData.invoices);
             return newPayment;
        }
    }, [isDbConnected, toast]);

    const getPaymentsForInvoice = useCallback((invoiceId: number) => {
        return payments.filter(p => p.invoiceId === invoiceId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [payments]);

    const addExpense = useCallback(async (expenseData: Omit<Expense, 'id'>) => {
        if (isDbConnected) {
            await dataActions.addExpense(expenseData);
            await loadAllData();
            toast({ title: "Expense Added", description: `New expense of ৳${expenseData.amount} has been recorded.` });
        } else {
            const newExpense = {...expenseData, id: `exp-${Date.now()}`};
            const offlineData = getOfflineData();
            offlineData.expenses.unshift(newExpense);
            setOfflineData(offlineData);
            setExpenses(offlineData.expenses);
            toast({ title: "Expense Added (Offline)" });
        }
    }, [toast, isDbConnected, loadAllData]);

    const updateExpense = useCallback(async (expenseId: string, updatedData: Omit<Expense, 'id'>) => {
        if(isDbConnected) {
            await dataActions.updateExpense(expenseId, updatedData);
            await loadAllData();
            toast({ title: "Expense Updated", description: "The expense details have been updated." });
        } else {
            const offlineData = getOfflineData();
            const index = offlineData.expenses.findIndex((e: Expense) => e.id === expenseId);
            if (index !== -1) {
                offlineData.expenses[index] = { id: expenseId, ...updatedData };
                setOfflineData(offlineData);
                setExpenses(offlineData.expenses);
                toast({ title: "Expense Updated (Offline)" });
            }
        }
    }, [toast, isDbConnected, loadAllData]);

    const deleteExpense = useCallback(async (expenseId: string) => {
        if(isDbConnected) {
            await dataActions.deleteExpense(expenseId);
            await loadAllData();
            toast({ title: "Expense Deleted", description: "The expense record has been removed." });
        } else {
            const offlineData = getOfflineData();
            offlineData.expenses = offlineData.expenses.filter((e: Expense) => e.id !== expenseId);
            setOfflineData(offlineData);
            setExpenses(offlineData.expenses);
            toast({ title: "Expense Deleted (Offline)" });
        }
    }, [toast, isDbConnected, loadAllData]);
    
    const getExpensesForDateRange = useCallback((startDate: Date, endDate: Date) => {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);
        return expenses.filter(exp => isWithinInterval(new Date(exp.date), { start, end }));
    }, [expenses]);

    const addEmployee = useCallback(async (employeeData: Omit<Employee, 'id'>) => {
        if (isDbConnected) {
            await dataActions.addEmployee(employeeData);
            await loadAllData();
            toast({ title: "Employee Added", description: `${employeeData.name} has been added.` });
        } else {
            const newEmployee = { ...employeeData, id: `emp-${Date.now()}`};
            const offlineData = getOfflineData();
            offlineData.employees.push(newEmployee);
            setOfflineData(offlineData);
            setEmployees(offlineData.employees);
            toast({ title: "Employee Added (Offline)" });
        }
    }, [toast, isDbConnected, loadAllData]);

    const updateEmployee = useCallback(async (employeeId: string, updatedData: Omit<Employee, 'id'>) => {
        if (isDbConnected) {
            await dataActions.updateEmployee(employeeId, updatedData);
            await loadAllData();
            toast({ title: "Employee Updated", description: "The employee details have been updated." });
        } else {
             const offlineData = getOfflineData();
            const index = offlineData.employees.findIndex((e: Employee) => e.id === employeeId);
            if (index !== -1) {
                offlineData.employees[index] = { id: employeeId, ...updatedData };
                setOfflineData(offlineData);
                setEmployees(offlineData.employees);
                toast({ title: "Employee Updated (Offline)" });
            }
        }
    }, [toast, isDbConnected, loadAllData]);

    const deleteEmployee = useCallback(async (employeeId: string) => {
        if (isDbConnected) {
            await dataActions.deleteEmployee(employeeId);
            await loadAllData();
            toast({ title: "Employee Deleted", description: "The employee record has been removed." });
        } else {
            const offlineData = getOfflineData();
            offlineData.employees = offlineData.employees.filter((e: Employee) => e.id !== employeeId);
            setOfflineData(offlineData);
            setEmployees(offlineData.employees);
            toast({ title: "Employee Deleted (Offline)" });
        }
    }, [toast, isDbConnected, loadAllData]);

    const markAttendance = useCallback(async (employeeId: string, date: Date, status: AttendanceStatus) => {
        const attendanceData = { employeeId, date: date.toISOString(), status };
        if (isDbConnected) {
            await dataActions.markAttendance(attendanceData);
            await loadAllData();
        } else {
             const offlineData = getOfflineData();
             const dateString = new Date(date).toISOString().split('T')[0];
             const index = offlineData.attendance.findIndex((a: Attendance) => a.employeeId === employeeId && a.date.startsWith(dateString));
             if (index !== -1) {
                offlineData.attendance[index].status = status;
             } else {
                offlineData.attendance.push({id: `att-${Date.now()}`, ...attendanceData});
             }
             setOfflineData(offlineData);
             setAttendance(offlineData.attendance);
        }
    }, [isDbConnected, loadAllData, toast]);

    const getAttendanceForDate = useCallback((date: Date) => {
        return attendance.filter(a => isSameDay(new Date(a.date), date));
    }, [attendance]);

    const addSalaryPayment = useCallback(async (paymentData: Omit<SalaryPayment, 'id'>) => {
        if (isDbConnected) {
            await dataActions.addSalaryPayment(paymentData);
            await loadAllData();
        } else {
            const newPayment = {...paymentData, id: `sal-${Date.now()}`};
            const offlineData = getOfflineData();
            offlineData.salaryPayments.unshift(newPayment);
            setOfflineData(offlineData);
            setSalaryPayments(offlineData.salaryPayments);
            toast({ title: "Salary Paid (Offline)" });
        }
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
