
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { useAppData } from '@/hooks/use-app-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, TrendingDown, Calendar as CalendarIcon, UserCheck, Package, HandCoins, Receipt, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { DailySalesDialog } from '@/components/daily-sales-report-dialog';
import { DailyExpensesReportDialog } from '@/components/daily-expenses-report-dialog';
import { DailyDueReportDialog } from '@/components/daily-due-report-dialog';


export default function Dashboard() {
  const { getInvoicesForDateRange, getExpensesForDateRange, getAttendanceSummaryForDate, isAppDataLoading: isLoading } = useAppData();
  const { t } = useTranslation();

  const [date, setDate] = useState<Date>(new Date());
  
  const [monthlyInvoices, setMonthlyInvoices] = useState<any[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<any[]>([]);
  const [todayInvoices, setTodayInvoices] = useState<any[]>([]);
  const [todayExpenses, setTodayExpenses] = useState<any[]>([]);
  const [todayAttendanceSummary, setTodayAttendanceSummary] = useState({ present: 0, total: 0 });
  
  const [isSalesReportDialogOpen, setSalesReportDialogOpen] = useState(false);
  const [isExpensesReportDialogOpen, setExpensesReportDialogOpen] = useState(false);
  const [isDueReportDialogOpen, setDueReportDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const currentMonthStart = startOfMonth(date);
      const currentMonthEnd = endOfMonth(date);
      setMonthlyInvoices(getInvoicesForDateRange(currentMonthStart, currentMonthEnd));
      setMonthlyExpenses(getExpensesForDateRange(currentMonthStart, currentMonthEnd));
      
      const today = new Date();
      setTodayInvoices(getInvoicesForDateRange(today, today));
      setTodayExpenses(getExpensesForDateRange(today, today));
      setTodayAttendanceSummary(getAttendanceSummaryForDate(today));
    }
  }, [isLoading, date, getInvoicesForDateRange, getExpensesForDateRange, getAttendanceSummaryForDate]);


  const monthlyStats = useMemo(() => {
    const totalSales = monthlyInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalExpenses = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const profit = totalSales - totalExpenses;
    return { totalSales, totalExpenses, profit };
  }, [monthlyInvoices, monthlyExpenses]);
  
  const todayStats = useMemo(() => {
      const totalSales = todayInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
      const totalExpenses = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalDue = todayInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
      const unitsSold = todayInvoices.reduce((sum, inv) => sum + inv.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
      const presentEmployees = todayAttendanceSummary.present;
      return { totalSales, totalExpenses, totalDue, unitsSold, presentEmployees };
  }, [todayInvoices, todayExpenses, todayAttendanceSummary]);
  
  const { dailySalesChartData, dailyExpensesChartData } = useMemo(() => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const salesData = daysInMonth.map(day => ({
        name: format(day, 'd'),
        Sales: monthlyInvoices
            .filter(inv => isSameDay(new Date(inv.date), day))
            .reduce((sum, inv) => sum + inv.subtotal, 0),
    }));

    const expensesData = daysInMonth.map(day => ({
        name: format(day, 'd'),
        Expense: monthlyExpenses
            .filter(exp => isSameDay(new Date(exp.date), day))
            .reduce((sum, exp) => sum + exp.amount, 0),
    }));

    return { dailySalesChartData: salesData, dailyExpensesChartData: expensesData };
  }, [monthlyInvoices, monthlyExpenses, date]);


  const chartConfig: ChartConfig = {
    Sales: { label: t('sales_label'), color: "hsl(var(--primary))" },
    Expense: { label: t('expense_label'), color: "hsl(var(--destructive))" },
  };

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
              <h1 className="text-2xl font-bold">{t('dashboard_sidebar')}</h1>
              <p className="text-muted-foreground">{t('welcome_back_header')}</p>
          </div>
          <Popover>
              <PopoverTrigger asChild>
              <Button
                  variant={"outline"}
                  className="w-full sm:w-[280px] justify-start text-left font-normal"
              >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "MMMM yyyy")}
              </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
              <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(day) => setDate(day || new Date())}
                  initialFocus
                  captionLayout="dropdown-buttons" 
                  fromYear={2020} 
                  toYear={new Date().getFullYear() + 1}
              />
              </PopoverContent>
          </Popover>
        </div>
        
        {/* Today's Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card as="button" onClick={() => setSalesReportDialogOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('todays_sales_card_title')}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">৳{todayStats.totalSales.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{t('invoices_count_footer', { count: todayInvoices.length })}</p>
              </CardContent>
            </Card>
            <Card as="button" onClick={() => setExpensesReportDialogOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{"Today's Expenses"}</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">৳{todayStats.totalExpenses.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{todayExpenses.length} expense entries</p>
              </CardContent>
            </Card>
            <Card as="button" onClick={() => setDueReportDialogOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('todays_due_card_title')}</CardTitle>
                  <HandCoins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">৳{todayStats.totalDue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{t('from_todays_sales_footer')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('units_sold_today_card_title')}</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{todayStats.unitsSold}</div>
                  <p className="text-xs text-muted-foreground">{t('total_items_footer')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('present_employees_card_title')}</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{todayStats.presentEmployees}</div>
                  <p className="text-xs text-muted-foreground">{t('out_of_total_employees_footer', { total: todayAttendanceSummary.total })}</p>
              </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('monthly_sales_card_title')}</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳{monthlyStats.totalSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{format(date, "MMMM yyyy")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('monthly_expenses_card_title')}</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳{monthlyStats.totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{format(date, "MMMM yyyy")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('profit_card_title')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${monthlyStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ৳{monthlyStats.profit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">{format(date, "MMMM yyyy")}</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
              <CardHeader>
              <CardTitle>{t('daily_sales_chart_title', { month: format(date, 'MMMM') })}</CardTitle>
              <CardDescription>{t('daily_sales_chart_description')}</CardDescription>
              </CardHeader>
              <CardContent>
              <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                  <BarChart data={dailySalesChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis />
                  <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="Sales" fill="var(--color-Sales)" radius={4} />
                  </BarChart>
              </ChartContainer>
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>Daily Expenses for {format(date, 'MMMM')}</CardTitle>
                  <CardDescription>Showing expense data for each day of the month.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                      <BarChart data={dailyExpensesChartData}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                          <YAxis />
                          <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent indicator="dot" />}
                          />
                          <Bar dataKey="Expense" fill="var(--color-Expense)" radius={4} />
                      </BarChart>
                  </ChartContainer>
              </CardContent>
          </Card>
        </div>
      </div>
      <DailySalesDialog
        open={isSalesReportDialogOpen}
        onOpenChange={setSalesReportDialogOpen}
        invoices={todayInvoices}
      />
      <DailyExpensesReportDialog
        open={isExpensesReportDialogOpen}
        onOpenChange={setExpensesReportDialogOpen}
        expenses={todayExpenses}
      />
      <DailyDueReportDialog
        open={isDueReportDialogOpen}
        onOpenChange={setDueReportDialogOpen}
        invoices={todayInvoices}
      />
    </>
  );
}
