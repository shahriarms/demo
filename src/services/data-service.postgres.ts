
'use server';

import { Pool } from 'pg';
import type { Product, Invoice, Buyer, Expense, Employee, SalaryPayment, Payment, Attendance, AttendanceStatus } from '@/lib/types';
import PostgresProductService from './product-service.postgres';

// This is a Server Action file. It will only run on the server.
const usePostgres = !!process.env.POSTGRES_URL;

const pool = usePostgres ? new Pool({ connectionString: process.env.POSTGRES_URL }) : null;


interface BackupData {
    products: Product[];
    invoices: Invoice[];
    buyers: Buyer[];
    expenses: Expense[];
    employees: Employee[];
    salaryPayments: SalaryPayment[];
    payments: Payment[];
}

// Helper function to format row data from snake_case to camelCase if needed, and parse JSON
function formatRow(row: any) {
    if (!row) return row;
    const newRow: { [key: string]: any } = {};
    for (const key in row) {
        // This simple camelCase conversion might need adjustment for complex names
        const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
        
        // Safely parse JSON fields
        if ((camelKey === 'items' || camelKey === 'invoiceIds') && typeof row[key] === 'string') {
             try {
                newRow[camelKey] = JSON.parse(row[key]);
            } catch (e) {
                newRow[camelKey] = row[key]; // Keep as string if parsing fails
            }
        } else {
             newRow[camelKey] = row[key];
        }

        // Convert numeric strings to numbers
        if (camelKey === 'subtotal' || camelKey === 'paidAmount' || camelKey === 'dueAmount' || camelKey === 'amount' || camelKey === 'salary') {
            newRow[camelKey] = parseFloat(row[key]);
        }
    }
    return newRow;
}


class PostgresDataService {

    static async getAllData() {
        if (!pool) throw new Error("Database not connected.");
        const invoices = (await pool.query('SELECT * FROM invoices ORDER BY id DESC')).rows.map(formatRow) as Invoice[];
        const buyers = (await pool.query('SELECT * FROM buyers ORDER BY name ASC')).rows.map(formatRow) as Buyer[];
        const expenses = (await pool.query('SELECT * FROM expenses ORDER BY date DESC')).rows.map(formatRow) as Expense[];
        const employees = (await pool.query('SELECT * FROM employees ORDER BY name ASC')).rows.map(formatRow) as Employee[];
        const salaryPayments = (await pool.query('SELECT * FROM salary_payments ORDER BY date DESC')).rows.map(formatRow) as SalaryPayment[];
        const payments = (await pool.query('SELECT * FROM payments ORDER BY date DESC')).rows.map(formatRow) as Payment[];
        const attendance = (await pool.query('SELECT * FROM attendance ORDER BY date DESC')).rows.map(formatRow) as Attendance[];

        return { invoices, buyers, expenses, employees, salaryPayments, payments, attendance };
    }

    static async getAllProducts(): Promise<Product[]> {
        return PostgresProductService.getAllProducts();
    }
    
    static async addInvoice(invoiceData: Omit<Invoice, 'id'>, items: any[]): Promise<Invoice> {
        if (!pool) throw new Error("Database not connected.");
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Get the last invoice ID and increment it
            const lastIdResult = await client.query('SELECT id FROM invoices ORDER BY id DESC LIMIT 1');
            const newId = lastIdResult.rows.length > 0 ? lastIdResult.rows[0].id + 1 : 1;
            
            const newInvoice = { ...invoiceData, id: newId };

            // Upsert buyer and get their ID
            let buyerId = invoiceData.buyerId;
            if (invoiceData.customerName) {
                let buyerResult = await client.query('SELECT id FROM buyers WHERE name = $1 AND phone = $2', [invoiceData.customerName, invoiceData.customerPhone]);
                if (buyerResult.rows.length > 0) {
                    buyerId = buyerResult.rows[0].id;
                } else {
                    buyerId = `buyer-${Date.now()}`;
                    await client.query(
                        'INSERT INTO buyers (id, name, address, phone, invoice_ids) VALUES ($1, $2, $3, $4, $5)',
                        [buyerId, invoiceData.customerName, invoiceData.customerAddress, invoiceData.customerPhone, JSON.stringify([newId])]
                    );
                }
                newInvoice.buyerId = buyerId;
            }

            // Insert invoice
            await client.query(
                'INSERT INTO invoices (id, buyer_id, customer_name, customer_address, customer_phone, items, subtotal, paid_amount, due_amount, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                [newInvoice.id, newInvoice.buyerId, newInvoice.customerName, newInvoice.customerAddress, newInvoice.customerPhone, JSON.stringify(items), newInvoice.subtotal, newInvoice.paidAmount, newInvoice.dueAmount, newInvoice.date]
            );

            // Update product stock
            const stockUpdates = items.map(item => ({
                id: item.id,
                stockChange: -item.quantity,
            }));
            await PostgresProductService.updateMultipleStocks(stockUpdates, client);
            
            await client.query('COMMIT');
            return formatRow(newInvoice) as Invoice;

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    static async addExpense(expenseData: Omit<Expense, 'id'>): Promise<Expense> {
        if (!pool) throw new Error("Database not connected.");
        const newId = `exp-${Date.now()}`;
        const newExpense = { ...expenseData, id: newId };
        await pool.query(
            'INSERT INTO expenses (id, main_category, name, description, amount, date) VALUES ($1, $2, $3, $4, $5, $6)',
            [newExpense.id, newExpense.mainCategory, newExpense.name, newExpense.description, newExpense.amount, newExpense.date]
        );
        return formatRow(newExpense) as Expense;
    }

    static async updateExpense(expenseId: string, updatedData: Omit<Expense, 'id'>): Promise<Expense | null> {
        if (!pool) throw new Error("Database not connected.");
        const { mainCategory, name, description, amount, date } = updatedData;
        const result = await pool.query(
            'UPDATE expenses SET main_category = $1, name = $2, description = $3, amount = $4, date = $5 WHERE id = $6 RETURNING *',
            [mainCategory, name, description, amount, date, expenseId]
        );
        return formatRow(result.rows[0]) as Expense;
    }

    static async deleteExpense(expenseId: string): Promise<void> {
        if (!pool) throw new Error("Database not connected.");
        await pool.query('DELETE FROM expenses WHERE id = $1', [expenseId]);
    }

     static async addEmployee(employeeData: Omit<Employee, 'id'>): Promise<Employee> {
        if (!pool) throw new Error("Database not connected.");
        const newId = `emp-${Date.now()}`;
        const newEmployee = { ...employeeData, id: newId };
        await pool.query(
            'INSERT INTO employees (id, name, phone, address, role, salary, joining_date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [newId, newEmployee.name, newEmployee.phone, newEmployee.address, newEmployee.role, newEmployee.salary, newEmployee.joiningDate]
        );
        return formatRow(newEmployee) as Employee;
    }

    static async updateEmployee(employeeId: string, updatedData: Omit<Employee, 'id'>): Promise<Employee | null> {
        if (!pool) throw new Error("Database not connected.");
        const { name, phone, address, role, salary, joiningDate } = updatedData;
        const result = await pool.query(
            'UPDATE employees SET name = $1, phone = $2, address = $3, role = $4, salary = $5, joining_date = $6 WHERE id = $7 RETURNING *',
            [name, phone, address, role, salary, joiningDate, employeeId]
        );
        return formatRow(result.rows[0]) as Employee;
    }

    static async deleteEmployee(employeeId: string): Promise<void> {
        if (!pool) throw new Error("Database not connected.");
        await pool.query('DELETE FROM employees WHERE id = $1', [employeeId]);
    }
    
    static async addSalaryPayment(paymentData: Omit<SalaryPayment, 'id'>): Promise<SalaryPayment> {
        if (!pool) throw new Error("Database not connected.");
        const newId = `sal-${Date.now()}`;
        const newPayment = { ...paymentData, id: newId };
        await pool.query(
            'INSERT INTO salary_payments (id, employee_id, amount, date, paid_by) VALUES ($1, $2, $3, $4, $5)',
            [newId, newPayment.employeeId, newPayment.amount, newPayment.date, newPayment.paidBy]
        );
        return formatRow(newPayment) as SalaryPayment;
    }

    static async addPayment(paymentData: Omit<Payment, 'id' | 'date'>): Promise<{ payment: Payment, updatedInvoice: Invoice }> {
        if (!pool) throw new Error("Database not connected.");
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const newId = `pay-${Date.now()}`;
            const newPayment = { ...paymentData, id: newId, date: new Date().toISOString() };
            
            await client.query(
                'INSERT INTO payments (id, invoice_id, buyer_id, amount, date) VALUES ($1, $2, $3, $4, $5)',
                [newId, newPayment.invoiceId, newPayment.buyerId, newPayment.amount, newPayment.date]
            );

            const updatedInvoiceResult = await client.query(
                'UPDATE invoices SET paid_amount = paid_amount + $1, due_amount = due_amount - $1 WHERE id = $2 RETURNING *',
                [newPayment.amount, newPayment.invoiceId]
            );

            await client.query('COMMIT');
            return {
                payment: formatRow(newPayment) as Payment,
                updatedInvoice: formatRow(updatedInvoiceResult.rows[0]) as Invoice,
            };

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    static async markAttendance(attendanceData: Omit<Attendance, 'id'>): Promise<Attendance> {
        if (!pool) throw new Error("Database not connected.");
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { employeeId, date, status } = attendanceData;
            
            const dateString = new Date(date).toISOString().split('T')[0];

            const existingResult = await client.query(
                "SELECT id FROM attendance WHERE employee_id = $1 AND date_trunc('day', date) = $2",
                [employeeId, dateString]
            );

            let result;
            if (existingResult.rows.length > 0) {
                // Update
                const existingId = existingResult.rows[0].id;
                result = await client.query(
                    'UPDATE attendance SET status = $1 WHERE id = $2 RETURNING *',
                    [status, existingId]
                );
            } else {
                // Insert
                const newId = `att-${Date.now()}`;
                result = await client.query(
                    'INSERT INTO attendance (id, employee_id, date, status) VALUES ($1, $2, $3, $4) RETURNING *',
                    [newId, employeeId, date, status]
                );
            }
            await client.query('COMMIT');
            return formatRow(result.rows[0]) as Attendance;

        } catch(e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    static async importAllData(data: { products?: Product[], invoices?: Invoice[], buyers?: Buyer[], expenses?: Expense[], employees?: Employee[], salaryPayments?: SalaryPayment[], payments?: Payment[], attendance?: Attendance[] }): Promise<{ success: boolean; message: string }> {
        if (!pool) throw new Error("Database not connected.");
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const tables = ['attendance', 'payments', 'salary_payments', 'invoices', 'buyers', 'expenses', 'employees', 'products'];
            for (const table of tables) {
                 await client.query(`TRUNCATE ${table} RESTART IDENTITY CASCADE`);
            }

            if (data.products) for (const p of data.products) await client.query('INSERT INTO products (id, name, sku, "buyingPrice", "profitMargin", "sellingPrice", stock, "mainCategory", category, "subCategory") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [p.id, p.name, p.sku, p.buyingPrice, p.profitMargin, p.sellingPrice, p.stock, p.mainCategory, p.category, p.subCategory]);
            if (data.employees) for (const e of data.employees) await client.query('INSERT INTO employees (id, name, phone, address, role, salary, joining_date) VALUES ($1, $2, $3, $4, $5, $6, $7)', [e.id, e.name, e.phone, e.address, e.role, e.salary, e.joiningDate]);
            if (data.expenses) for (const e of data.expenses) await client.query('INSERT INTO expenses (id, main_category, name, description, amount, date) VALUES ($1, $2, $3, $4, $5, $6)', [e.id, e.mainCategory, e.name, e.description, e.amount, e.date]);
            if (data.buyers) for (const b of data.buyers) await client.query('INSERT INTO buyers (id, name, address, phone, invoice_ids) VALUES ($1, $2, $3, $4, $5)', [b.id, b.name, b.address, b.phone, JSON.stringify(b.invoiceIds)]);
            if (data.invoices) for (const i of data.invoices) await client.query('INSERT INTO invoices (id, buyer_id, customer_name, customer_address, customer_phone, items, subtotal, paid_amount, due_amount, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [i.id, i.buyerId, i.customerName, i.customerAddress, i.customerPhone, JSON.stringify(i.items), i.subtotal, i.paidAmount, i.dueAmount, i.date]);
            if (data.salaryPayments) for (const sp of data.salaryPayments) await client.query('INSERT INTO salary_payments (id, employee_id, amount, date, paid_by) VALUES ($1, $2, $3, $4, $5)', [sp.id, sp.employeeId, sp.amount, sp.date, sp.paidBy]);
            if (data.payments) for (const p of data.payments) await client.query('INSERT INTO payments (id, invoice_id, buyer_id, amount, date) VALUES ($1, $2, $3, $4, $5)', [p.id, p.invoiceId, p.buyerId, p.amount, p.date]);
            if (data.attendance) for (const a of data.attendance) await client.query('INSERT INTO attendance (id, employee_id, date, status) VALUES ($1, $2, $3, $4)', [a.id, a.employeeId, a.date, a.status]);

            await client.query('COMMIT');
            return { success: true, message: "Data imported successfully." };
        } catch (e: any) {
            await client.query('ROLLBACK');
            console.error('Import failed, transaction rolled back.', e);
            return { success: false, message: e.message || "An unknown error occurred during import." };
        } finally {
            client.release();
        }
    }
}

export default PostgresDataService;
