
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useAppData } from '@/hooks/use-app-data';
import type { Expense } from '@/lib/types';
import { cn } from '@/lib/utils';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useTranslation } from '@/hooks/use-translation';

const expenseSchema = z.object({
  category: z.string({ required_error: "Please select a category." }),
  description: z.string().min(3, "Description must be at least 3 characters.").max(100, "Description is too long."),
  amount: z.coerce.number().positive("Amount must be greater than 0."),
  date: z.date({ required_error: "Please select a date." }),
  paymentMethod: z.string({ required_error: "Please select a payment method." }),
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
            ? { ...expense, date: new Date(expense.date) }
            : {
                category: '',
                description: '',
                amount: 0,
                date: new Date(),
                paymentMethod: '',
            },
    });

    useEffect(() => {
        if (open) {
            form.reset(isEditMode ? { ...expense, date: new Date(expense.date) } : {
                category: '',
                description: '',
                amount: 0,
                date: new Date(),
                paymentMethod: '',
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
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('category_label')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('select_expense_category_placeholder')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Rent">{t('expense_category_rent')}</SelectItem>
                                            <SelectItem value="Utility">{t('expense_category_utility')}</SelectItem>
                                            <SelectItem value="Salary">{t('expense_category_salary')}</SelectItem>
                                            <SelectItem value="Equipment">{t('expense_category_equipment')}</SelectItem>
                                            <SelectItem value="Misc">{t('expense_category_misc')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('description_label')}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder={t('expense_description_placeholder')} {...field} />
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
                                        <Input type="number" placeholder="0.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('date_of_expense_label')}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                        {field.value ? format(field.value, "PPP") : <span>{t('pick_a_date')}</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="paymentMethod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('payment_method_label')}</FormLabel>
                                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('select_payment_method_placeholder')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Cash">{t('payment_method_cash')}</SelectItem>
                                                <SelectItem value="bKash">{t('payment_method_bkash')}</SelectItem>
                                                <SelectItem value="Card">{t('payment_method_card')}</SelectItem>
                                                <SelectItem value="Bank">{t('payment_method_bank')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
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

    