
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

function printNormalReceipt(printRef: React.RefObject<HTMLDivElement>, invoiceId: string): Promise<boolean> {
    return new Promise(async (resolve) => {
        const printContents = printRef.current?.innerHTML;
        if (!printContents) {
            resolve(false);
            return;
        }

        const printWindow = window.open('', '', 'height=800,width=800');

        if (printWindow) {
            try {
                // Use the invoice ID in the title to suggest it as the filename
                printWindow.document.write(`<html><head><title>${invoiceId}</title>`);
                // Inject styles directly
                printWindow.document.write('</head><body>');
                printWindow.document.write(printContents);
                printWindow.document.write('</body></html>');
                printWindow.document.close();

                let printed = false;
                const handleAfterPrint = () => {
                    printed = true;
                    printWindow.close();
                    resolve(true);
                };
                
                printWindow.addEventListener('afterprint', handleAfterPrint);

                // A short delay to ensure content is fully rendered before printing
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                    // If the print dialog is closed without printing, `onafterprint` might not fire.
                    // We use a timeout to check if it was likely cancelled.
                    setTimeout(() => {
                       if (!printed) {
                           printWindow.close();
                           resolve(false);
                       }
                    }, 500); 
                }, 250);

            } catch (error) {
                console.error("Error preparing print window:", error);
                alert("Could not prepare print window. Please try again.");
                printWindow.close();
                resolve(false);
            }

        } else {
            alert("Your browser is blocking popups. Please allow popups for this site to print.");
            resolve(false);
        }
    });
}


const useInvoicesData = (): InvoiceContextType => {
  const { invoices, setInvoices, buyers, setBuyers, isAppDataLoading } = useAppData();
  const { toast } = useToast();
  const { settings } = useSettings();

  const saveInvoiceData = (draftInvoice: DraftInvoice, newId: string) => {
    const invoiceToSave: Invoice = {
      id: newId,
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
    setBuyers(prevBuyers => {
      const existingBuyerIndex = prevBuyers.findIndex(b => b.name === invoiceToSave.customerName && b.phone === invoiceToSave.customerPhone);
      
      if (existingBuyerIndex > -1) {
        const updatedBuyers = [...prevBuyers];
        const existingBuyer = updatedBuyers[existingBuyerIndex];
        existingBuyer.invoiceIds.push(newId);
        return updatedBuyers;
      } else {
        const newBuyer: Buyer = {
          id: `buyer-${Date.now()}`,
          name: invoiceToSave.customerName,
          address: invoiceToSave.customerAddress,
          phone: invoiceToSave.customerPhone,
          invoiceIds: [newId],
        };
        return [...prevBuyers, newBuyer];
      }
    });
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
      const printed = await printNormalReceipt(printRef, newId);
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
  }, [settings, toast]);
  
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


export function useInvoices() {
  return useInvoicesData();
}
