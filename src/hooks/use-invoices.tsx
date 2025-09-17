
'use client';

import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import type { Invoice, Buyer, AppSettings } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import type { DraftInvoice } from './use-invoice-form';
import { useSettings } from './use-settings';
import { isWithinInterval, isSameDay } from 'date-fns';
import { useAppData } from './use-app-data';

interface InvoiceContextType {
  invoices: Invoice[];
  buyers: Buyer[];
  saveAndPrintInvoice: (draftInvoice: DraftInvoice, printRef: React.RefObject<HTMLDivElement>) => Promise<boolean>;
  updateInvoiceDue: (invoiceId: string, amountPaid: number) => void;
  getInvoicesForBuyer: (buyerId: string) => Invoice[];
  getInvoicesForDateRange: (startDate: Date, endDate: Date) => Invoice[];
  getInvoicesForDay: (date: Date) => Invoice[];
  isLoading: boolean;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);


async function printPosReceipt(settings: AppSettings, orderData: any) {
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
        body: JSON.stringify({
          printer: printerConfig,
          data: orderData,
        }),
      });

    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'An unknown error occurred during printing.');
    }
}

function printNormalReceipt(printRef: React.RefObject<HTMLDivElement>): Promise<boolean> {
    return new Promise(async (resolve) => {
        
        document.body.classList.add('printing');

        setTimeout(() => {
            window.print();
            document.body.classList.remove('printing');
            resolve(true);
        }, 100); 

    });
}


const useInvoicesData = (): InvoiceContextType => {
  const { invoices, setInvoices, buyers, setBuyers, isAppDataLoading } = useAppData();
  const { toast } = useToast();
  const { settings } = useSettings();

  const saveInvoiceData = (draftInvoice: DraftInvoice, newId: string) => {
    
    let buyerId = draftInvoice.buyerId || '';
    
    // Find or create buyer
    const existingBuyer = buyers.find(b => b.name === draftInvoice.customerName && b.phone === draftInvoice.customerPhone);
    if (existingBuyer) {
        buyerId = existingBuyer.id;
        setBuyers(prev => prev.map(b => b.id === buyerId ? { ...b, invoiceIds: [...b.invoiceIds, newId] } : b));
    } else {
        buyerId = `buyer-${Date.now()}`;
        const newBuyer: Buyer = {
            id: buyerId,
            name: draftInvoice.customerName,
            address: draftInvoice.customerAddress,
            phone: draftInvoice.customerPhone,
            invoiceIds: [newId],
        };
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
  };

  const saveAndPrintInvoice = useCallback(async (draftInvoice: DraftInvoice, printRef: React.RefObject<HTMLDivElement>): Promise<boolean> => {
    const newId = `INV-${Date.now()}`;
    
    if (settings.printFormat === 'pos' && settings.posPrinterType !== 'disabled') {
      const orderData = {
        orderId: newId,
        customerName: draftInvoice.customerName,
        items: draftInvoice.items,
        subtotal: draftInvoice.subtotal,
        tax: 0,
        total: draftInvoice.subtotal,
      };
      saveInvoiceData(draftInvoice, newId);
      await printPosReceipt(settings, orderData);
      return true; 
    } else {
      const printed = await printNormalReceipt(printRef);
      if (printed) {
        saveInvoiceData(draftInvoice, newId);
        return true;
      }
      toast({
        variant: "destructive",
        title: "Print Cancelled",
        description: "The invoice was not saved because the print process was cancelled.",
      });
      return false;
    }
  }, [settings, toast, buyers, setBuyers, setInvoices]);
  
  const updateInvoiceDue = useCallback((invoiceId: string, amountPaid: number) => {
    setInvoices(prevInvoices => 
        prevInvoices.map(inv => {
            if (inv.id === invoiceId) {
                const newPaidAmount = inv.paidAmount + amountPaid;
                const newDueAmount = inv.subtotal - newPaidAmount;
                return {
                    ...inv,
                    paidAmount: newPaidAmount,
                    dueAmount: newDueAmount < 0 ? 0 : newDueAmount,
                };
            }
            return inv;
        })
    );
  }, [setInvoices]);

  const getInvoicesForBuyer = useCallback((buyerId: string) => {
    const buyer = buyers.find(b => b.id === buyerId);
    if (!buyer) return [];
    
    const invoiceMap = new Map(invoices.map(inv => [inv.id, inv]));
    const uniqueInvoiceIds = [...new Set(buyer.invoiceIds)];

    return uniqueInvoiceIds
        .map(id => invoiceMap.get(id))
        .filter((inv): inv is Invoice => !!inv)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [buyers, invoices]);

  const getInvoicesForDateRange = useCallback((startDate: Date, endDate: Date) => {
    return invoices.filter(inv => isWithinInterval(new Date(inv.date), { start: startDate, end: endDate }));
  }, [invoices]);
  
  const getInvoicesForDay = useCallback((date: Date) => {
    return invoices.filter(inv => isSameDay(new Date(inv.date), date));
  }, [invoices]);

  return useMemo(() => ({ invoices, buyers, saveAndPrintInvoice, getInvoicesForBuyer, getInvoicesForDateRange, getInvoicesForDay, updateInvoiceDue, isLoading: isAppDataLoading }), [invoices, buyers, saveAndPrintInvoice, getInvoicesForBuyer, getInvoicesForDateRange, getInvoicesForDay, updateInvoiceDue, isAppDataLoading]);
}

export function InvoiceProvider({ children }: { children: ReactNode }) {
    const value = useInvoicesData();
    return (
        <InvoiceContext.Provider value={value}>
            {children}
        </InvoiceContext.Provider>
    );
}

export function useInvoices() {
    const context = useContext(InvoiceContext);
    if (context === undefined) {
        throw new Error('useInvoices must be used within an InvoiceProvider');
    }
    return context;
}
