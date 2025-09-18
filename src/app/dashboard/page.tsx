
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
import { DollarSign, ShoppingCart, TrendingUp, TrendingDown, Calendar as CalendarIcon, Package, HandCoins, Receipt, Loader2, BadgeIndianRupee, Container } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { DailySalesDialog } from '@/components/daily-sales-report-dialog';
import { DailyExpensesReportDialog } from '@/components/daily-expenses-report-dialog';
import { DailyDueReportDialog } from '@/components/daily-due-report-dialog';
import { DailyUnitsSoldReportDialog } from '@/components/daily-units-sold-report-dialog';
import { MonthlySalesDialog } from '@/components/monthly-sales-report-dialog';
import { MonthlyExpensesDialog } from '@/components/monthly-expenses-report-dialog';
import { MonthlyDueDialog } from '@/components/monthly-due-report-dialog';
import { MonthlyUnitsSoldDialog } from '@/components/monthly-units-sold-report-dialog';


export default function Dashboard() {
  const { products, getInvoicesForDateRange, getExpensesForDateRange, isAppDataLoading: isLoading } = useAppData();
  const { t } = useTranslation();

  const [date, setDate] = useState<Date>(new Date());
  
  const [monthlyInvoices, setMonthlyInvoices] = useState<any[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<any[]>([]);
  const [todayInvoices, setTodayInvoices] = useState<any[]>([]);
  const [todayExpenses, setTodayExpenses] = useState<any[]>([]);
  
  const [isDailySalesReportOpen, setDailySalesReportOpen] = useState(false);
  const [isDailyExpensesReportOpen, setDailyExpensesReportOpen] = useState(false);
  const [isDailyDueReportOpen, setDailyDueReportOpen] = useState(false);
  const [isDailyUnitsSoldReportOpen, setDailyUnitsSoldReportOpen] = useState(false);
  
  const [isMonthlySalesReportOpen, setMonthlySalesReportOpen] = useState(false);
  const [isMonthlyExpensesReportOpen, setMonthlyExpensesReportOpen] = useState(false);
  const [isMonthlyDueReportOpen, setMonthlyDueReportOpen] = useState(false);
  const [isMonthlyUnitsSoldReportOpen, setMonthlyUnitsSoldReportOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      setMonthlyInvoices(getInvoicesForDateRange(monthStart, monthEnd));
      setMonthlyExpenses(getExpensesForDateRange(monthStart, monthEnd));
      
      const today = new Date();
      setTodayInvoices(getInvoicesForDateRange(today, today));
      setTodayExpenses(getExpensesForDateRange(today, today));
    }
  }, [isLoading, date, getInvoicesForDateRange, getExpensesForDateRange]);


  const monthlyStats = useMemo(() => {
    const totalSales = monthlyInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalExpenses = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const profit = totalSales - totalExpenses;
    const totalDue = monthlyInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
    const unitsSold = monthlyInvoices.reduce((sum, inv) => sum + inv.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    return { totalSales, totalExpenses, profit, totalDue, unitsSold };
  }, [monthlyInvoices, monthlyExpenses]);
  
  const todayStats = useMemo(() => {
      const totalSales = todayInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
      const totalExpenses = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const profit = totalSales - totalExpenses;
      const totalDue = todayInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
      const unitsSold = todayInvoices.reduce((sum, inv) => sum + inv.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
      return { totalSales, totalExpenses, profit, totalDue, unitsSold };
  }, [todayInvoices, todayExpenses]);
  
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
                  id="date"
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
        <div>
            <h2 className="text-lg font-semibold mb-4">Today's Summary</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card as="button" onClick={() => setDailySalesReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('todays_sales_card_title')}</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">৳{todayStats.totalSales.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">{t('invoices_count_footer', { count: todayInvoices.length })}</p>
                  </CardContent>
                </Card>
                <Card as="button" onClick={() => setDailyExpensesReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{"Today's Expenses"}</CardTitle>
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">৳{todayStats.totalExpenses.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">{todayExpenses.length} expense entries</p>
                  </CardContent>
                </Card>
                <Card as="button" onClick={() => setDailyDueReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('todays_due_card_title')}</CardTitle>
                      <HandCoins className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">৳{todayStats.totalDue.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">{t('from_todays_sales_footer')}</p>
                  </CardContent>
                </Card>
                <Card as="button" onClick={() => setDailyUnitsSoldReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
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
                      <CardTitle className="text-sm font-medium">Today's Profit</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className={`text-2xl font-bold ${todayStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ৳{todayStats.profit.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">Sales minus Expenses</p>
                  </CardContent>
                </Card>
            </div>
        </div>

        <div>
            <h2 className="text-lg font-semibold mb-4">This Month's Summary ({format(date, "MMMM")})</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card as="button" onClick={() => setMonthlySalesReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('monthly_sales_card_title')}</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">৳{monthlyStats.totalSales.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{monthlyInvoices.length} invoices this month</p>
                </CardContent>
              </Card>
              <Card as="button" onClick={() => setMonthlyExpensesReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('monthly_expenses_card_title')}</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">৳{monthlyStats.totalExpenses.toFixed(2)}</div>
                   <p className="text-xs text-muted-foreground">{monthlyExpenses.length} entries this month</p>
                </CardContent>
              </Card>
               <Card as="button" onClick={() => setMonthlyDueReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Due</CardTitle>
                  <BadgeIndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">৳{monthlyStats.totalDue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Total outstanding from this month</p>
                </CardContent>
              </Card>
               <Card as="button" onClick={() => setMonthlyUnitsSoldReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Units Sold</CardTitle>
                  <Container className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{monthlyStats.unitsSold}</div>
                  <p className="text-xs text-muted-foreground">Total items sold this month</p>
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
                  <p className="text-xs text-muted-foreground">Total Profit for {format(date, "MMMM")}</p>
                </CardContent>
              </Card>
            </div>
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
        open={isDailySalesReportOpen}
        onOpenChange={setDailySalesReportOpen}
        invoices={todayInvoices}
      />
      <DailyExpensesReportDialog
        open={isDailyExpensesReportOpen}
        onOpenChange={setDailyExpensesReportOpen}
        expenses={todayExpenses}
      />
      <DailyDueReportDialog
        open={isDailyDueReportOpen}
        onOpenChange={setDailyDueReportOpen}
        invoices={todayInvoices}
      />
      <DailyUnitsSoldReportDialog
        open={isDailyUnitsSoldReportOpen}
        onOpenChange={setDailyUnitsSoldReportOpen}
        invoices={todayInvoices}
        products={products}
      />

      <MonthlySalesDialog
        open={isMonthlySalesReportOpen}
        onOpenChange={setMonthlySalesReportOpen}
        invoices={monthlyInvoices}
        month={date}
      />
      <MonthlyExpensesDialog
        open={isMonthlyExpensesReportOpen}
        onOpenChange={setMonthlyExpensesReportOpen}
        expenses={monthlyExpenses}
        month={date}
      />
      <MonthlyDueDialog
        open={isMonthlyDueReportOpen}
        onOpenChange={setMonthlyDueReportOpen}
        invoices={monthlyInvoices}
        month={date}
      />
      <MonthlyUnitsSoldDialog
        open={isMonthlyUnitsSoldReportOpen}
        onOpenChange={setMonthlyUnitsSoldReportOpen}
        invoices={monthlyInvoices}
        products={products}
        month={date}
      />
    </>
  );
}
