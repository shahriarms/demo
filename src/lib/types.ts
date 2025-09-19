export interface Product {
  id: string;
  name: string;
  sku: string;
  buyingPrice: number;
  profitMargin: number;
  sellingPrice: number;
  stock: number;
  mainCategory: 'Material' | 'Hardware';
  category: string;
  subCategory: string;
}

export interface InvoiceItem {
  id: string; // This will be the product ID
  name: string;
  quantity: number;
  price: number; // This will be the sellingPrice at the time of sale
}

export interface Payment {
    id: string;
    invoiceId: number;
    buyerId: string;
    amount: number;
    date: string; // ISO 8601 date string
}

export interface Invoice {
  id: number;
  buyerId?: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  paidAmount: number;
  dueAmount: number;
  date: string; // ISO 8601 date string
  cashReceived?: number;
  changeAmount?: number;
}

export interface Buyer {
  id: string;
  name: string;
  address: string;
  phone: string;
  invoiceIds: string[];
}

export interface Expense {
    id: string;
    mainCategory: 'Shop' | 'Owner';
    name: string;
    description?: string;
    amount: number;
    date: string; // ISO 8601 date string
}

export interface Employee {
    id: string;
    name: string;
    phone: string;
    address: string;
    role: 'Manager' | 'Sales' | 'Worker' | 'Accountant' | string;
    salary: number;
    joiningDate: string; // ISO 8601 date string
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

export interface Attendance {
    id: string;
    employeeId: string;
    date: string; // ISO 8601 date string
    status: AttendanceStatus;
}

export interface SalaryPayment {
    id: string;
    employeeId: string;
    amount: number;
    date: string; // ISO 8601 date string
    paidBy: string; // user email or id
}

export type PrintFormat = 'normal' | 'pos';
export type Locale = 'en' | 'bn';
export type POSPrinterType = 'disabled' | 'usb' | 'tcp';

export interface AppSettings {
    printFormat: PrintFormat;
    locale: Locale;
    posPrinterType: POSPrinterType;
    posPrinterHost: string;
    posPrinterPort: number;
}
