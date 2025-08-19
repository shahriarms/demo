
'use client';

import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import type { Expense } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { isSameDay, isWithinInterval } from 'date-fns';
import { useAppData } from './use-app-data';

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expenseId: string, updatedData: Omit<Expense, 'id'>) => void;
  deleteExpense: (expenseId: string) => void;
  getExpensesForDateRange: (startDate: Date, endDate: Date) => Expense[];
  getExpensesForDay: (date: Date) => Expense[];
  isLoading: boolean;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const useExpensesData = (): ExpenseContextType => {
  const { expenses, setExpenses, isAppDataLoading } = useAppData();
  const { toast } = useToast();

  const addExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    setExpenses(prev => [newExpense, ...prev]);
    toast({
      title: "Expense Added",
      description: `New expense of $${expenseData.amount} has been recorded.`,
    });
  }, [toast, setExpenses]);

  const updateExpense = useCallback((expenseId: string, updatedData: Omit<Expense, 'id'>) => {
    setExpenses(prev =>
      prev.map(e => (e.id === expenseId ? { id: expenseId, ...updatedData } : e))
    );
    toast({
      title: "Expense Updated",
      description: "The expense details have been successfully updated.",
    });
  }, [toast, setExpenses]);
    
  const deleteExpense = useCallback((expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    toast({
      title: "Expense Deleted",
      description: "The expense record has been removed.",
    });
  }, [toast, setExpenses]);

  const getExpensesForDateRange = useCallback((startDate: Date, endDate: Date) => {
    return expenses.filter(exp => isWithinInterval(new Date(exp.date), { start: startDate, end: endDate }));
  }, [expenses]);
  
  const getExpensesForDay = useCallback((date: Date) => {
    return expenses.filter(exp => isSameDay(new Date(exp.date), date));
  }, [expenses]);
  
  return useMemo(() => ({ expenses, addExpense, updateExpense, deleteExpense, getExpensesForDateRange, getExpensesForDay, isLoading: isAppDataLoading }), [expenses, addExpense, updateExpense, deleteExpense, getExpensesForDateRange, getExpensesForDay, isAppDataLoading]);
}

export function useExpenses() {
  return useExpensesData();
}
