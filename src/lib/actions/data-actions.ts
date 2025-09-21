
'use server';

import { Pool } from 'pg';
import type { Product, Invoice, Buyer, Expense, Employee, SalaryPayment, Payment, Attendance } from '@/lib/types';
import PostgresDataService from '@/services/data-service.postgres';

// This is a Server Action file. It will only run on the server.
const usePostgres = !!process.env.POSTGRES_URL;

interface BackupData {
    products: Product[];
    invoices: Invoice[];
    buyers: Buyer[];
    expenses: Expense[];
    employees: Employee[];
    salaryPayments: SalaryPayment[];
    payments: Payment[];
}

export async function getAllData(): Promise<Omit<BackupData, 'products'>> {
    if (!usePostgres) {
        throw new Error("Database not connected. Cannot fetch data.");
    }
    return PostgresDataService.getAllData();
}

export async function addInvoice(invoiceData: Omit<Invoice, 'id'>, items: any[]): Promise<Invoice> {
    if (!usePostgres) {
        throw new Error("Database not connected.");
    }
    return PostgresDataService.addInvoice(invoiceData, items);
}

export async function deleteInvoice(invoiceId: number): Promise<{ success: boolean }> {
    if (!usePostgres) {
        throw new Error("Database not connected.");
    }
    await PostgresDataService.deleteInvoice(invoiceId);
    return { success: true };
}

export async function addExpense(expenseData: Omit<Expense, 'id'>): Promise<Expense> {
    if (!usePostgres) {
        throw new Error("Database not connected.");
    }
    return PostgresDataService.addExpense(expenseData);
}

export async function updateExpense(expenseId: string, updatedData: Omit<Expense, 'id'>): Promise<Expense | null> {
    if (!usePostgres) {
        throw new Error("Database not connected.");
    }
    return PostgresDataService.updateExpense(expenseId, updatedData);
}

export async function deleteExpense(expenseId: string): Promise<{ success: boolean }> {
    if (!usePostgres) {
        throw new Error("Database not connected.");
    }
    await PostgresDataService.deleteExpense(expenseId);
    return { success: true };
}


export async function addEmployee(employeeData: Omit<Employee, 'id'>): Promise<Employee> {
    if (!usePostgres) {
        throw new Error("Database not connected.");
    }
    return PostgresDataService.addEmployee(employeeData);
}

export async function updateEmployee(employeeId: string, updatedData: Omit<Employee, 'id'>): Promise<Employee | null> {
    if (!usePostgres) {
        throw new Error("Database not connected.");
    }
    return PostgresDataService.updateEmployee(employeeId, updatedData);
}

export async function deleteEmployee(employeeId: string): Promise<{ success: boolean }> {
    if (!usePostgres) {
        throw new Error("Database not connected.");
    }
    await PostgresDataService.deleteEmployee(employeeId);
    return { success: true };
}


export async function addSalaryPayment(paymentData: Omit<SalaryPayment, 'id'>): Promise<SalaryPayment> {
    if (!usePostgres) {
        throw new Error("Database not connected.");
    }
    return PostgresDataService.addSalaryPayment(paymentData);
}

export async function addPayment(paymentData: Omit<Payment, 'id' | 'date'>): Promise<{ payment: Payment, updatedInvoice: Invoice }> {
     if (!usePostgres) {
        throw new Error("Database not connected.");
    }
    return PostgresDataService.addPayment(paymentData);
}

export async function markAttendance(attendanceData: Omit<Attendance, 'id'>): Promise<Attendance> {
     if (!usePostgres) {
        throw new Error("Database not connected.");
    }
    return PostgresDataService.markAttendance(attendanceData);
}


export async function exportAllData(): Promise<BackupData> {
    if (!usePostgres) {
        throw new Error("Database not connected. Cannot export data.");
    }
    
    const [products, otherData] = await Promise.all([
        PostgresDataService.getAllProducts(),
        PostgresDataService.getAllData()
    ]);
    
    return {
        products,
        ...otherData
    };
}


export async function importAllData(data: BackupData): Promise<{ success: boolean; message: string }> {
    if (!usePostgres) {
        throw new Error("Database not connected. Cannot import data.");
    }
    
    return PostgresDataService.importAllData(data);
}

    