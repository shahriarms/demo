
'use client';

import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import type { InvoiceItem, Product } from '@/lib/types';
import { useToast } from './use-toast';
import { useAppData } from './use-app-data';

export interface DraftInvoiceItem extends InvoiceItem {
    originalPrice: number;
}

export interface DraftInvoice {
    id: string;
    items: DraftInvoiceItem[];
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    paidAmount: number;
    subtotal: number;
    dueAmount: number;
    buyerId?: string; // Add buyerId to draft
}

interface InvoiceFormContextType {
    drafts: DraftInvoice[];
    activeDraftIndex: number;
    activeDraft: DraftInvoice | null;
    addNewDraft: () => void;
    removeDraft: (draftId: string) => void;
    setActiveDraftIndex: (index: number) => void;
    updateActiveDraft: (update: Partial<Omit<DraftInvoice, 'id' | 'subtotal' | 'dueAmount'>>) => void;
    addInvoiceItem: (product: Product) => void;
    updateInvoiceItem: (itemId: string, update: Partial<DraftInvoiceItem>) => void;
    removeInvoiceItem: (itemId: string) => void;
    resetActiveDraft: () => void;
    isFormLoading: boolean;
}

const InvoiceFormContext = createContext<InvoiceFormContextType | undefined>(undefined);

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

const calculateTotals = (items: DraftInvoiceItem[], paidAmount: number) => {
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const dueAmount = subtotal - paidAmount;
    return { subtotal, dueAmount };
}

const useInvoiceFormData = (): InvoiceFormContextType => {
    const { invoiceDrafts, setInvoiceDrafts, activeDraftIndex, setActiveDraftIndex, isAppDataLoading } = useAppData();
    const { toast } = useToast();
    
    const activeDraft = useMemo(() => invoiceDrafts[activeDraftIndex] || null, [invoiceDrafts, activeDraftIndex]);
    
    const addNewDraft = useCallback(() => {
        if (invoiceDrafts.length >= 10) {
            toast({
                variant: 'destructive',
                title: "Memo Limit Reached",
                description: "You can only have a maximum of 10 open memos at a time.",
            });
            return;
        }
        const newDraft = createNewDraft();
        setInvoiceDrafts(prev => [...prev, newDraft]);
        setActiveDraftIndex(invoiceDrafts.length);
    }, [invoiceDrafts.length, toast, setInvoiceDrafts, setActiveDraftIndex]);
    
    const removeDraft = useCallback((draftId: string) => {
        setInvoiceDrafts(prev => {
            const newDrafts = prev.filter(d => d.id !== draftId);
            if (newDrafts.length === 0) {
                setActiveDraftIndex(0);
                return [createNewDraft()];
            }
            
            setActiveDraftIndex(currentActiveIndex => {
                if (currentActiveIndex >= newDrafts.length) {
                    return newDrafts.length - 1;
                }
                return currentActiveIndex;
            });
            return newDrafts;
        });
    }, [setInvoiceDrafts, setActiveDraftIndex]);

    const updateActiveDraft = useCallback((update: Partial<Omit<DraftInvoice, 'id' | 'subtotal' | 'dueAmount'>>) => {
        setInvoiceDrafts(prev => prev.map((draft, index) => {
            if (index === activeDraftIndex) {
                const updatedDraft = { ...draft, ...update };
                const { subtotal, dueAmount } = calculateTotals(updatedDraft.items, updatedDraft.paidAmount);
                updatedDraft.subtotal = subtotal;
                updatedDraft.dueAmount = dueAmount;
                return updatedDraft;
            }
            return draft;
        }));
    }, [activeDraftIndex, setInvoiceDrafts]);

    const addInvoiceItem = useCallback((product: Product) => {
        setInvoiceDrafts(prev => prev.map((draft, index) => {
            if (index !== activeDraftIndex) return draft;

            const existingItem = draft.items.find(item => item.id === product.id);
            let newItems;
            if (existingItem) {
                newItems = draft.items.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            } else {
                const newItem: DraftInvoiceItem = {
                    id: product.id,
                    name: product.name,
                    quantity: 1,
                    price: product.sellingPrice,
                    originalPrice: product.sellingPrice,
                };
                newItems = [...draft.items, newItem];
            }
            const { subtotal, dueAmount } = calculateTotals(newItems, draft.paidAmount);
            return { ...draft, items: newItems, subtotal, dueAmount };
        }));
    }, [activeDraftIndex, setInvoiceDrafts]);
    
    const updateInvoiceItem = useCallback((itemId: string, itemUpdate: Partial<DraftInvoiceItem>) => {
        setInvoiceDrafts(prev => prev.map((draft, index) => {
            if (index !== activeDraftIndex) return draft;
            const newItems = draft.items.map(item => item.id === itemId ? { ...item, ...itemUpdate } : item);
            const { subtotal, dueAmount } = calculateTotals(newItems, draft.paidAmount);
            return { ...draft, items: newItems, subtotal, dueAmount };
        }));
    }, [activeDraftIndex, setInvoiceDrafts]);

    const removeInvoiceItem = useCallback((itemId: string) => {
        setInvoiceDrafts(prev => prev.map((draft, index) => {
            if (index !== activeDraftIndex) return draft;
            const newItems = draft.items.filter(item => item.id !== itemId);
            const { subtotal, dueAmount } = calculateTotals(newItems, draft.paidAmount);
            return { ...draft, items: newItems, subtotal, dueAmount };
        }));
    }, [activeDraftIndex, setInvoiceDrafts]);

    const resetActiveDraft = useCallback(() => {
        setInvoiceDrafts(prev => prev.map((draft, index) => {
            if (index === activeDraftIndex) {
                return createNewDraft();
            }
            return draft;
        }));
    }, [activeDraftIndex, setInvoiceDrafts]);


    return useMemo(() => ({
        drafts: invoiceDrafts,
        activeDraftIndex,
        activeDraft,
        addNewDraft,
        removeDraft,
        setActiveDraftIndex,
        updateActiveDraft,
        addInvoiceItem,
        updateInvoiceItem,
        removeInvoiceItem,
        resetActiveDraft,
        isFormLoading: isAppDataLoading,
    }), [invoiceDrafts, activeDraftIndex, activeDraft, addNewDraft, removeDraft, setActiveDraftIndex, updateActiveDraft, addInvoiceItem, updateInvoiceItem, removeInvoiceItem, resetActiveDraft, isAppDataLoading]);
}

export function InvoiceFormProvider({ children }: { children: ReactNode }) {
    const value = useInvoiceFormData();
    return (
        <InvoiceFormContext.Provider value={value}>
            {children}
        </InvoiceFormContext.Provider>
    );
}

export function useInvoiceForm() {
    const context = useContext(InvoiceFormContext);
    if (context === undefined) {
        throw new Error('useInvoiceForm must be used within an InvoiceFormProvider');
    }
    return context;
}
