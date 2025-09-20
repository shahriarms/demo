'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppData } from '@/hooks/use-app-data';
import type { Expense } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useTranslation } from '@/hooks/use-translation';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const expenseSchema = z.object({
  mainCategory: z.enum(['Shop', 'Owner'], { required_error: "Please select a main category."}),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.'}),
  description: z.string().max(100, "Description is too long.").optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0."),
  date: z.date(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    expense: Expense | null;
}

export function ExpenseDialog({ open, onOpenChange, expense }: ExpenseDialogProps) {
    const { addExpense, updateExpense } = useAppData();
    const { t } = useTranslation();
    const isEditMode = !!expense;

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema),
        defaultValues: isEditMode
            ? { ...expense, date: new Date(expense.date), amount: expense.amount || undefined }
            : {
                mainCategory: 'Shop',
                name: '',
                description: '',
                amount: undefined,
                date: new Date(),
            },
    });

    useEffect(() => {
        if (open) {
            form.reset(isEditMode ? { ...expense, date: new Date(expense.date), amount: expense.amount || undefined } : {
                mainCategory: 'Shop',
                name: '',
                description: '',
                amount: undefined,
                date: new Date(),
            });
        }
    }, [open, expense, isEditMode, form]);

    const onSubmit = (data: ExpenseFormValues) => {
        const expenseData = {
            ...data,
            date: data.date.toISOString(), // Store date as ISO string
        };

        if (isEditMode) {
            updateExpense(expense.id, expenseData);
        } else {
            addExpense(expenseData);
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? t('edit_expense_dialog_title') : t('add_expense_dialog_title')}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? t('edit_expense_dialog_description') : t('add_expense_dialog_description_new')}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="mainCategory"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Main Category</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex space-x-4"
                                    >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="Shop" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Shop Expense</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="Owner" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Owner Expense</FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Rent, Utility Bill" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('amount_label')}</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('description_label')} (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder={t('expense_description_placeholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel_button')}</Button>
                            <Button type="submit">{isEditMode ? t('save_changes_button') : t('add_expense_button')}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

    