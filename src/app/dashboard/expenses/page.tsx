
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import type { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { PlusCircle, Download, MoreHorizontal, Search, Trash2, Pencil, PackageOpen, Loader2, Receipt } from 'lucide-react';
import { ExpenseDialog } from '@/components/expense-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTranslation } from '@/hooks/use-translation';


const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

interface SummaryStats {
    todayTotal: number;
    monthTotal: number;
    todayCategoryData: { name: string; value: number }[];
}


export default function ExpensesPage() {
    const { expenses, isAppDataLoading: isLoading, deleteExpense } = useAppData();
    const { t } = useTranslation();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortKey, setSortKey] = useState('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    
    const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
    const [monthChartData, setMonthChartData] = useState<any[] | null>(null);


    const handleAddNew = () => {
        setExpenseToEdit(null);
        setDialogOpen(true);
    };

    const handleEdit = (expense: Expense) => {
        setExpenseToEdit(expense);
        setDialogOpen(true);
    };

    const handleDelete = (expense: Expense) => {
        setExpenseToDelete(expense);
    };
    
    const confirmDelete = () => {
        if (expenseToDelete) {
            deleteExpense(expenseToDelete.id);
            setExpenseToDelete(null);
        }
    };

    const filteredAndSortedExpenses = useMemo(() => {
        let result = expenses
            .filter(e => searchTerm ? e.name.toLowerCase().includes(searchTerm.toLowerCase()) : true)
            .filter(e => categoryFilter ? e.mainCategory === categoryFilter : true);

        result.sort((a, b) => {
            let valA, valB;
            if (sortKey === 'date') {
                valA = new Date(a.date).getTime();
                valB = new Date(b.date).getTime();
            } else if (sortKey === 'amount') {
                valA = a.amount;
                valB = b.amount;
            } else { // category
                valA = a.name;
                valB = b.name;
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [expenses, searchTerm, categoryFilter, sortKey, sortOrder]);


    useEffect(() => {
        if (isLoading) return;

        const now = new Date();
        const todayExpenses = expenses.filter(e => isSameDay(new Date(e.date), now));
        const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const monthExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= monthStart && expenseDate <= monthEnd;
        });
        const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const newMonthChartData = daysInMonth.map(day => ({
            name: format(day, 'd'),
            Expense: monthExpenses
                .filter(e => isSameDay(new Date(e.date), day))
                .reduce((sum, e) => sum + e.amount, 0)
        }));
        setMonthChartData(newMonthChartData);
        
        const todayCategoryData = ['Shop', 'Owner'].map(cat => ({
            name: cat,
            value: todayExpenses.filter(e => e.mainCategory === cat).reduce((sum, e) => sum + e.amount, 0)
        })).filter(d => d.value > 0);
        
        setSummaryStats({ todayTotal, monthTotal, todayCategoryData });
    }, [expenses, isLoading, t]);
    
    const chartConfig: ChartConfig = {
      Expense: { label: t('expense_label'), color: "hsl(var(--primary))" },
    };

    const handleExport = (fileType: 'csv' | 'xlsx' | 'pdf') => {
        if (fileType === 'pdf') {
            const doc = new jsPDF();
            doc.text(t('expense_report_title'), 14, 16);
            (doc as any).autoTable({
                head: [[t('date_header'), 'Main Category', 'Name', t('description_header'), t('amount_header')]],
                body: filteredAndSortedExpenses.map(e => [
                    format(new Date(e.date), 'yyyy-MM-dd'),
                    e.mainCategory,
                    e.name,
                    e.description || '-',
                    '৳ '+e.amount.toFixed(2),
                ]),
            });
            doc.save('expenses.pdf');
        } else {
            const worksheet = XLSX.utils.json_to_sheet(filteredAndSortedExpenses.map(e => ({
                [t('date_header')]: format(new Date(e.date), 'yyyy-MM-dd'),
                'Main Category': e.mainCategory,
                'Name': e.name,
                [t('description_header')]: e.description || '-',
                [t('amount_header')]: e.amount,
            })));
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, t('expenses_tab_title'));
            XLSX.writeFile(workbook, `expenses.${fileType}`);
        }
    };

    if (isLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Receipt className="w-6 h-6"/> {t('expenses_page_title')}</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none"><Download className="mr-2 h-4 w-4"/> {t('export_button')}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('csv')}>{t('export_as_csv')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>{t('export_as_excel')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>{t('export_as_pdf')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleAddNew} className="flex-1 sm:flex-none">
              <PlusCircle className="mr-2 h-4 w-4" /> {t('add_expense_button')}
            </Button>
          </div>
        </div>

        {/* Summary Cards & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>{t('todays_expenses_card_title')}</CardTitle>
                    <CardDescription>{t('todays_expenses_description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {!summaryStats ? <div className="flex justify-center items-center min-h-[150px]"><Loader2 className="h-8 w-8 animate-spin"/></div> : (
                        <>
                            <p className="text-3xl font-bold">&#2547; {summaryStats.todayTotal.toFixed(2)}</p>
                            {summaryStats.todayCategoryData.length > 0 ? (
                                <ChartContainer config={{}} className="min-h-32 mt-4">
                                    <PieChart>
                                        <Pie data={summaryStats.todayCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                                             {summaryStats.todayCategoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                    </PieChart>
                                </ChartContainer>
                            ) : <p className="text-sm text-muted-foreground mt-4">{t('no_expenses_today')}</p>}
                        </>
                    )}
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>{t('this_months_expenses_title')}</CardTitle>
                     {!summaryStats ? <div className="h-5"/> : <CardDescription>{t('total_label')}: <span className="font-bold">&#2547; {summaryStats.monthTotal.toFixed(2)}</span></CardDescription>}
                </CardHeader>
                <CardContent>
                    {!monthChartData ? <div className="flex justify-center items-center min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin"/></div> : (
                        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                            <BarChart data={monthChartData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="Expense" fill="var(--color-Expense)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>
        </div>


        {/* Expenses Table */}
        <Card>
            <CardHeader>
                <CardTitle>{t('all_expenses_title')}</CardTitle>
                <CardDescription>{t('all_expenses_description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                 <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="search" 
                            placeholder="Search by name..."
                            className="pl-8" 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value === 'all' ? '' : value)}>
                        <SelectTrigger className="w-full md:w-48">
                            <SelectValue placeholder="Filter by Main Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="Shop">Shop Expense</SelectItem>
                            <SelectItem value="Owner">Owner Expense</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="rounded-md border overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden sm:table-cell">Category</TableHead>
                                <TableHead className="hidden md:table-cell">{t('date_header')}</TableHead>
                                <TableHead className="text-right">{t('amount_header')}</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedExpenses.length > 0 ? (
                                filteredAndSortedExpenses.map(expense => (
                                    <TableRow key={expense.id}>
                                        <TableCell>
                                            <p className="font-medium">{expense.name}</p>
                                            <p className="text-sm text-muted-foreground sm:hidden">{format(new Date(expense.date), 'PP')}</p>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell"><span className="text-sm text-muted-foreground">{expense.mainCategory}</span></TableCell>
                                        <TableCell className="hidden md:table-cell">{format(new Date(expense.date), 'PP')}</TableCell>
                                        <TableCell className="text-right font-mono">&#2547; {expense.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(expense)}><Pencil className="mr-2 h-4 w-4"/> {t('edit_button')}</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDelete(expense)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/> {t('delete_button')}</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <p className="mt-4">{t('no_expenses_found')}</p>
                                        <p className="text-sm text-muted-foreground">{t('adjust_filters_or_add_expense')}</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
        
        <ExpenseDialog 
            open={isDialogOpen} 
            onOpenChange={setDialogOpen}
            expense={expenseToEdit}
        />
        <AlertDialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('are_you_sure_title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('delete_expense_confirmation')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel_button')}</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">{t('delete_button')}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </div>
    )
}

    

    