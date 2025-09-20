
'use client';

import { createContext, useContext, ReactNode, useMemo, useCallback, useState, useEffect } from 'react';
import type { InvoiceItem, Product } from '@/lib/types';
import { useToast } from './use-toast';
import { useAppData } from './use-app-data';

export interface DraftInvoiceItem extends InvoiceItem {
    originalPrice: number;
}

export interface DraftInvoice {
    id: number | string;
    label: string;
    items: DraftInvoiceItem[];
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    paidAmount?: number;
    subtotal: number;
    dueAmount: number;
    cashReceived?: number;
    changeAmount?: number;
    buyerId?: string;
}

interface InvoiceFormContextType {
    drafts: DraftInvoice[];
    activeDraftIndex: number;
    activeDraft: DraftInvoice | null;
    addNewDraft: () => void;
    removeDraft: (draftId: string | number) => void;
    setActiveDraftIndex: (index: number) => void;
    updateActiveDraft: (update: Partial<Omit<DraftInvoice, 'subtotal' | 'dueAmount' | 'changeAmount' | 'label'>>) => void;
    addInvoiceItem: (product: Product) => void;
    updateInvoiceItem: (itemId: string, update: { [key: string]: string }) => void;
    removeInvoiceItem: (itemId: string) => void;
    resetActiveDraft: () => void;
    isFormLoading: boolean;
    products: Product[];
}

const InvoiceFormContext = createContext<InvoiceFormContextType | undefined>(undefined);

const createNewDraft = (index: number, lastInvoiceId: number, isLoading: boolean): DraftInvoice => {
    let id: number | string;
    let label: string;

    if (isLoading) {
        id = '...';
        label = `New Memo ${index + 1}`;
    } else {
        id = lastInvoiceId + index + 1;
        label = `Memo #${id}`;
    }

    return {
        id,
        label,
        items: [],
        customerName: '',
        customerAddress: '',
        customerPhone: '',
        paidAmount: undefined,
        subtotal: 0,
        dueAmount: 0,
        cashReceived: undefined,
        changeAmount: 0,
    }
};

const calculateTotals = (items: DraftInvoiceItem[], paidAmount?: number, cashReceived?: number) => {
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const dueAmount = subtotal - (paidAmount || 0);
    const changeAmount = (cashReceived && cashReceived > subtotal) ? cashReceived - subtotal : 0;
    return { subtotal, dueAmount, changeAmount };
};

const STORAGE_KEYS = {
    invoiceDrafts: 'stockpilot-invoice-drafts',
    activeInvoiceDraftIndex: 'stockpilot-active-invoice-draft-index'
};

const useInvoiceFormData = (): InvoiceFormContextType => {
    const { isAppDataLoading, products, lastInvoiceId } = useAppData();
    const { toast } = useToast();
    
    const [drafts, setDrafts] = useState<DraftInvoice[]>([]);
    const [activeDraftIndex, setActiveDraftIndex] = useState(0);

    // Initialize state from localStorage ONCE on mount
    useEffect(() => {
        try {
            const savedDrafts = localStorage.getItem(STORAGE_KEYS.invoiceDrafts);
            const savedIndex = localStorage.getItem(STORAGE_KEYS.activeInvoiceDraftIndex);

            if (savedDrafts) {
                let parsedDrafts: DraftInvoice[] = JSON.parse(savedDrafts);
                if (Array.isArray(parsedDrafts) && parsedDrafts.length > 0) {
                    setDrafts(parsedDrafts);
                    if (savedIndex) {
                        const parsedIndex = JSON.parse(savedIndex);
                        if (parsedIndex < parsedDrafts.length) {
                            setActiveDraftIndex(parsedIndex);
                        }
                    }
                    return;
                }
            }
        } catch (error) {
            console.error("Failed to load invoice form state from localStorage", error);
        }
    }, []);

    // Effect to react to data loading and initialize/update drafts if needed
    useEffect(() => {
        if (isAppDataLoading) return;
        
        if (drafts.length === 0) {
            // This runs if localStorage was empty or invalid
            setDrafts([createNewDraft(0, lastInvoiceId, false)]);
        } else {
            // This runs on subsequent loads (e.g., after an invoice is created)
            // It ensures draft IDs are correct if lastInvoiceId has changed.
            const correctedDrafts = drafts.map((draft, index) => {
                const newId = lastInvoiceId + index + 1;
                // Only update if it's a new session or the ID is clearly a placeholder
                 if (draft.label === `Memo #${draft.id}` || draft.label.startsWith('New Memo')) {
                     return { ...draft, id: newId, label: `Memo #${newId}` };
                 }
                return { ...draft, id: newId };
            });
            setDrafts(correctedDrafts);
        }
        // We only want this to run when the core data is loaded/reloaded, not on every draft change.
    }, [isAppDataLoading, lastInvoiceId]);


    // Save state to localStorage whenever it changes
    useEffect(() => {
        // Only save to localStorage when app data is fully loaded to avoid saving incomplete state
        if (drafts.length > 0 && !isAppDataLoading) {
            try {
                localStorage.setItem(STORAGE_KEYS.invoiceDrafts, JSON.stringify(drafts));
                localStorage.setItem(STORAGE_KEYS.activeInvoiceDraftIndex, JSON.stringify(activeDraftIndex));
            } catch (error) {
                console.error("Failed to save invoice form state to localStorage", error);
            }
        }
    }, [drafts, activeDraftIndex, isAppDataLoading]);
    
    const activeDraft = useMemo(() => drafts[activeDraftIndex] || null, [drafts, activeDraftIndex]);
    
    const addNewDraft = useCallback(() => {
        if (drafts.length >= 10) {
            toast({
                variant: 'destructive',
                title: "Memo Limit Reached",
                description: "You can only have a maximum of 10 open memos at a time.",
            });
            return;
        }
        setDrafts(prev => {
            const newDraft = createNewDraft(prev.length, lastInvoiceId, isAppDataLoading);
            return [...prev, newDraft];
        });
        setActiveDraftIndex(drafts.length);
    }, [drafts.length, toast, lastInvoiceId, isAppDataLoading]);
    
    const removeDraft = useCallback((draftId: string | number) => {
        setDrafts(prev => {
            const draftIndex = prev.findIndex(d => d.id === draftId);
            const newDrafts = prev.filter(d => d.id !== draftId);
            
            if (newDrafts.length === 0) {
                setActiveDraftIndex(0);
                return [createNewDraft(0, lastInvoiceId, isAppDataLoading)];
            }
            
            if (activeDraftIndex >= draftIndex && activeDraftIndex > 0) {
                 setActiveDraftIndex(activeDraftIndex - 1);
            }

            return newDrafts;
        });
    }, [activeDraftIndex, lastInvoiceId, isAppDataLoading]);

    const updateActiveDraft = useCallback((update: Partial<Omit<DraftInvoice, 'subtotal' | 'dueAmount' | 'changeAmount' | 'label'>>) => {
        setDrafts(prev => prev.map((draft, index) => {
            if (index === activeDraftIndex) {
                const updatedDraft = { ...draft, ...update };
                const { subtotal, dueAmount, changeAmount } = calculateTotals(updatedDraft.items, updatedDraft.paidAmount, updatedDraft.cashReceived);
                updatedDraft.subtotal = subtotal;
                updatedDraft.dueAmount = dueAmount;
                updatedDraft.changeAmount = changeAmount;
                // Update label if customerName is changed and it's a draft
                if(typeof updatedDraft.id === 'string' || (typeof updatedDraft.id === 'number' && update.customerName && updatedDraft.label.startsWith('Memo'))) {
                    updatedDraft.label = update.customerName || `Memo #${updatedDraft.id}`;
                }
                return updatedDraft;
            }
            return draft;
        }));
    }, [activeDraftIndex]);

    const addInvoiceItem = useCallback((product: Product) => {
        setDrafts(prev => prev.map((draft, index) => {
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
            const { subtotal, dueAmount, changeAmount } = calculateTotals(newItems, draft.paidAmount, draft.cashReceived);
            return { ...draft, items: newItems, subtotal, dueAmount, changeAmount };
        }));
    }, [activeDraftIndex]);
    
    const updateInvoiceItem = useCallback((itemId: string, itemUpdate: { [key: string]: string }) => {
        setDrafts(prev => prev.map((draft, index) => {
            if (index !== activeDraftIndex) return draft;
    
            const newItems = draft.items.map(item => {
                if (item.id === itemId) {
                    const updatedItem = { ...item };
                    const key = Object.keys(itemUpdate)[0];
                    const value = itemUpdate[key];
                    
                    if (key === 'quantity' || key === 'price') {
                        // @ts-ignore
                        updatedItem[key] = parseFloat(value) || 0;
                    }
                    return updatedItem;
                }
                return item;
            });
    
            const { subtotal, dueAmount, changeAmount } = calculateTotals(newItems, draft.paidAmount, draft.cashReceived);
            return { ...draft, items: newItems, subtotal, dueAmount, changeAmount };
        }));
    }, [activeDraftIndex]);

    const removeInvoiceItem = useCallback((itemId: string) => {
        setDrafts(prev => prev.map((draft, index) => {
            if (index !== activeDraftIndex) return draft;
            const newItems = draft.items.filter(item => item.id !== itemId);
            const { subtotal, dueAmount, changeAmount } = calculateTotals(newItems, draft.paidAmount, draft.cashReceived);
            return { ...draft, items: newItems, subtotal, dueAmount, changeAmount };
        }));
    }, [activeDraftIndex]);

    const resetActiveDraft = useCallback(() => {
        setDrafts(prev => prev.map((draft, index) => {
            if (index === activeDraftIndex) {
                return createNewDraft(index, lastInvoiceId, isAppDataLoading);
            }
            return draft;
        }));
    }, [activeDraftIndex, lastInvoiceId, isAppDataLoading]);


    return useMemo(() => ({
        drafts,
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
        products,
    }), [drafts, activeDraftIndex, activeDraft, addNewDraft, removeDraft, setActiveDraftIndex, updateActiveDraft, addInvoiceItem, updateInvoiceItem, removeInvoiceItem, resetActiveDraft, isAppDataLoading, products]);
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
