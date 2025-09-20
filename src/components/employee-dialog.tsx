'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useAppData } from '@/hooks/use-app-data';
import type { Employee } from '@/lib/types';
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

const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().min(10, "Please enter a valid phone number."),
  address: z.string().min(5, "Please enter a valid address."),
  role: z.string({ required_error: "Please select a role." }),
  salary: z.coerce.number().positive("Salary must be a positive number."),
  joiningDate: z.date({ required_error: "Please select a joining date." }),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: Employee | null;
}

export function EmployeeDialog({ open, onOpenChange, employee }: EmployeeDialogProps) {
    const { addEmployee, updateEmployee } = useAppData();
    const { t } = useTranslation();
    const isEditMode = !!employee;

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        defaultValues: isEditMode
            ? { ...employee, joiningDate: new Date(employee.joiningDate), salary: employee.salary || undefined }
            : {
                name: '',
                phone: '',
                address: '',
                role: '',
                salary: undefined,
                joiningDate: new Date(),
            },
    });

    useEffect(() => {
        if (open) {
            form.reset(isEditMode ? { ...employee, joiningDate: new Date(employee.joiningDate), salary: employee.salary || undefined } : {
                name: '',
                phone: '',
                address: '',
                role: '',
                salary: undefined,
                joiningDate: new Date(),
            });
        }
    }, [open, employee, isEditMode, form]);

    const onSubmit = (data: EmployeeFormValues) => {
        const employeeData = {
            ...data,
            joiningDate: data.joiningDate.toISOString(),
        };

        if (isEditMode) {
            updateEmployee(employee.id, employeeData);
        } else {
            addEmployee(employeeData);
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? t('edit_employee_dialog_title') : t('add_employee_dialog_title')}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? t('edit_employee_dialog_description') : t('add_employee_dialog_description_new')}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('full_name_label')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('full_name_placeholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('phone_number_label')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('phone_number_placeholder')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('role_label')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder={t('select_role_placeholder')} /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Manager">{t('role_manager')}</SelectItem>
                                                <SelectItem value="Sales">{t('role_sales')}</SelectItem>
                                                <SelectItem value="Worker">{t('role_worker')}</SelectItem>
                                                <SelectItem value="Accountant">{t('role_accountant')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('address_label')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('address_placeholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <FormField
                                control={form.control}
                                name="salary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('salary_label')}</FormLabel>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">&#2547;</span>
                                            <FormControl>
                                                <Input type="number" placeholder="0.00" className="pl-8" {...field} value={field.value ?? ''} />
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="joiningDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('joining_date_label')}</FormLabel>
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
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel_button')}</Button>
                            <Button type="submit">{isEditMode ? t('save_changes_button') : t('add_employee_button')}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
