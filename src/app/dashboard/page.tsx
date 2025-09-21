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
import { DollarSign, ShoppingCart, TrendingUp, TrendingDown, Calendar as CalendarIcon, Package, HandCoins, Receipt, Loader2, BadgeIndianRupee, Container, Wallet, RotateCw, Users, ThumbsUp, Weight } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, differenceInDays } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { DailySalesDialog } from '@/components/daily-sales-report-dialog';
import { DailyExpensesReportDialog } from '@/components/daily-expenses-report-dialog';
import { DailyDueReportDialog } from '@/components/daily-due-report-dialog';
import { DailyUnitsSoldReportDialog } from '@/components/daily-units-sold-report-dialog';
import { DailyAttendanceReportDialog } from '@/components/daily-attendance-report-dialog';
import { MonthlySalesDialog } from '@/components/monthly-sales-report-dialog';
import { MonthlyExpensesDialog } from '@/components/monthly-expenses-report-dialog';
import { MonthlyDueDialog } from '@/components/monthly-due-report-dialog';
import { MonthlyUnitsSoldDialog } from '@/components/monthly-units-sold-report-dialog';
import { MonthlySalaryReportDialog } from '@/components/monthly-salary-report-dialog';
import type { DateRange } from 'react-day-picker';
import type { Invoice, Expense, SalaryPayment, Attendance, Product } from '@/lib/types';


export default function Dashboard() {
  const { products, employees, getInvoicesForDateRange, getExpensesForDateRange, getSalaryPaymentsForDateRange, getGrossProfitForDateRange, isAppDataLoading: isLoading, getAttendanceForDate, invoices: allInvoices } = useAppData();
  const { t } = useTranslation();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const [rangeInvoices, setRangeInvoices] = useState<Invoice[]>([]);
  const [rangeExpenses, setRangeExpenses] = useState<Expense[]>([]);
  const [rangeSalaries, setRangeSalaries] = useState<SalaryPayment[]>([]);
  const [todayInvoices, setTodayInvoices] = useState<Invoice[]>([]);
  const [todayExpenses, setTodayExpenses] = useState<Expense[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  
  const [isDailySalesReportOpen, setDailySalesReportOpen] = useState(false);
  const [isDailyExpensesReportOpen, setDailyExpensesReportOpen] = useState(false);
  const [isDailyDueReportOpen, setDailyDueReportOpen] = useState(false);
  const [isDailyUnitsSoldReportOpen, setDailyUnitsSoldReportOpen] = useState(false);
  const [isDailyAttendanceReportOpen, setDailyAttendanceReportOpen] = useState(false);
  
  const [isMonthlySalesReportOpen, setMonthlySalesReportOpen] = useState(false);
  const [isMonthlyExpensesReportOpen, setMonthlyExpensesReportOpen] = useState(false);
  const [isMonthlyDueReportOpen, setMonthlyDueReportOpen] = useState(false);
  const [isMonthlyUnitsSoldReportOpen, setMonthlyUnitsSoldReportOpen] = useState(false);
  const [isMonthlySalaryReportOpen, setMonthlySalaryReportOpen] = useState(false);
  
  // This useEffect ensures all date-sensitive operations run only on the client, preventing hydration errors.
  useEffect(() => {
    // Set the initial date range to the current month on the client-side
    setDateRange({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    // Set today's data on client-side
    const today = new Date();
    setTodayInvoices(getInvoicesForDateRange(today, today));
    setTodayExpenses(getExpensesForDateRange(today, today));
    setTodayAttendance(getAttendanceForDate(today));
  }, [getInvoicesForDateRange, getExpensesForDateRange, getAttendanceForDate]);

  // This useEffect updates the date range data when the range changes.
  useEffect(() => {
    if (!isLoading && dateRange?.from && dateRange?.to) {
      setRangeInvoices(getInvoicesForDateRange(dateRange.from, dateRange.to));
      setRangeExpenses(getExpensesForDateRange(dateRange.from, dateRange.to));
      setRangeSalaries(getSalaryPaymentsForDateRange(dateRange.from, dateRange.to));
    }
  }, [isLoading, dateRange, getInvoicesForDateRange, getExpensesForDateRange, getSalaryPaymentsForDateRange]);


  const calculateUnitsSold = useCallback((invoices: Invoice[], products: Product[]) => {
      let materialSoldKg = 0;
      let hardwareSoldPcs = 0;
      const productMap = new Map(products.map(p => [p.id, p]));

      invoices.forEach(invoice => {
          invoice.items.forEach(item => {
              const product = productMap.get(item.id);
              if (product) {
                  if (product.mainCategory === 'Material') {
                      materialSoldKg += item.quantity;
                  } else if (product.mainCategory === 'Hardware') {
                      hardwareSoldPcs += item.quantity;
                  }
              }
          });
      });
      return { materialSoldKg, hardwareSoldPcs };
  }, []);

  const rangeStats = useMemo(() => {
    const totalSales = rangeInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalExpenses = rangeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalSalaryPaid = rangeSalaries.reduce((sum, sal) => sum + sal.amount, 0);
    const grossProfit = getGrossProfitForDateRange(rangeInvoices);
    const profit = grossProfit - totalExpenses - totalSalaryPaid;
    const totalDue = rangeInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
    const { materialSoldKg, hardwareSoldPcs } = calculateUnitsSold(rangeInvoices, products);
    return { totalSales, totalExpenses, totalSalaryPaid, profit, totalDue, materialSoldKg, hardwareSoldPcs };
  }, [rangeInvoices, rangeExpenses, rangeSalaries, getGrossProfitForDateRange, products, calculateUnitsSold]);
  
  const todayStats = useMemo(() => {
      const totalSales = todayInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
      const totalExpenses = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const grossProfit = getGrossProfitForDateRange(todayInvoices);
      const profit = grossProfit - totalExpenses;
      const totalDue = todayInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
      const { materialSoldKg, hardwareSoldPcs } = calculateUnitsSold(todayInvoices, products);
      const presentToday = todayAttendance.filter(a => a.status === 'Present').length;
      return { totalSales, totalExpenses, profit, totalDue, materialSoldKg, hardwareSoldPcs, presentToday };
  }, [todayInvoices, todayExpenses, todayAttendance, getGrossProfitForDateRange, products, calculateUnitsSold]);
  
  const { salesChartData, expensesChartData } = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return { salesChartData: [], expensesChartData: [] };

    const daysInRange = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    const salesData = daysInRange.map(day => ({
        name: format(day, 'd'),
        Sales: rangeInvoices
            .filter(inv => isSameDay(new Date(inv.date), day))
            .reduce((sum, inv) => sum + inv.subtotal, 0),
    }));

    const expensesData = daysInRange.map(day => ({
        name: format(day, 'd'),
        Expense: rangeExpenses
            .filter(exp => isSameDay(new Date(exp.date), day))
            .reduce((sum, exp) => sum + exp.amount, 0),
    }));

    return { salesChartData: salesData, expensesChartData: expensesData };
  }, [rangeInvoices, rangeExpenses, dateRange]);

  const handleReset = useCallback(() => {
    setDateRange({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
  }, []);


  const chartConfig: ChartConfig = {
    Sales: { label: t('sales_label'), color: "hsl(var(--primary))" },
    Expense: { label: t('expense_label'), color: "hsl(var(--destructive))" },
  };

  const rangeTitle = useMemo(() => {
    if (!dateRange?.from) return "This Month";
    if (dateRange.to) {
        if (isSameDay(dateRange.from, startOfMonth(dateRange.from)) && isSameDay(dateRange.to, endOfMonth(dateRange.from))) {
            return format(dateRange.from, 'MMMM yyyy');
        }
        if (isSameDay(dateRange.from, dateRange.to)) {
            return format(dateRange.from, 'PPP');
        }
        return `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`;
    }
    return format(dateRange.from, 'PPP');
  }, [dateRange]);

  if (isLoading || !dateRange) {
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
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className="w-full sm:w-auto justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  captionLayout="dropdown-buttons"
                  fromYear={2019}
                  toYear={new Date().getFullYear() + 5}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={handleReset}>
                <RotateCw className="h-4 w-4" />
                <span className="sr-only">Reset Date</span>
            </Button>
          </div>
        </div>
        
        {/* Today's Summary Cards */}
        <div>
            <h2 className="text-lg font-semibold mb-4">{t('todays_summary_title')}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <Card as="button" onClick={() => setDailySalesReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('todays_sales_card_title')}</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">৳ {todayStats.totalSales.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">{t('invoices_count_footer', { count: todayInvoices.length })}</p>
                  </CardContent>
                </Card>
                <Card as="button" onClick={() => setDailyExpensesReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('todays_expenses_card_title')}</CardTitle>
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">৳ {todayStats.totalExpenses.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">{t('expense_entries_footer', { count: todayExpenses.length })}</p>
                  </CardContent>
                </Card>
                <Card as="button" onClick={() => setDailyDueReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors" disabled={todayStats.totalDue <= 0}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('todays_due_card_title')}</CardTitle>
                      <HandCoins className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold text-red-600">৳ {todayStats.totalDue.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">{t('from_todays_sales_footer')}</p>
                  </CardContent>
                </Card>
                <Card as="button" onClick={() => setDailyUnitsSoldReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('units_sold_today_card_title')}</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="flex items-baseline gap-2">
                        <div className="text-xl font-bold">{todayStats.materialSoldKg.toFixed(2)}</div>
                        <span className="text-xs text-muted-foreground">kg</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-xl font-bold">{todayStats.hardwareSoldPcs}</div>
                        <span className="text-xs text-muted-foreground">pcs</span>
                      </div>
                  </CardContent>
                </Card>
                 <Card as="button" onClick={() => setDailyAttendanceReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('todays_attendance_card_title')}</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">{todayStats.presentToday}</div>
                      <p className="text-xs text-muted-foreground">{t('out_of_total_employees_footer', { total: employees.length })}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('todays_profit_card_title')}</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className={`text-2xl font-bold ${todayStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ৳ {todayStats.profit.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">{t('profit_formula_footer_short')}</p>
                  </CardContent>
                </Card>
            </div>
        </div>

        {/* Date Range Summary Cards */}
        <div>
            <h2 className="text-lg font-semibold mb-4">{t('date_range_summary_title', { range: rangeTitle })}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              <Card as="button" onClick={() => setMonthlySalesReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('monthly_sales_card_title')}</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">৳ {rangeStats.totalSales.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{t('invoices_in_range_footer', { count: rangeInvoices.length })}</p>
                </CardContent>
              </Card>
              <Card as="button" onClick={() => setMonthlyExpensesReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('monthly_expenses_card_title')}</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">৳ {rangeStats.totalExpenses.toFixed(2)}</div>
                   <p className="text-xs text-muted-foreground">{t('expense_entries_footer', { count: rangeExpenses.length })}</p>
                </CardContent>
              </Card>
               <Card as="button" onClick={() => setMonthlySalaryReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('salary_paid_card_title')}</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">৳ {rangeStats.totalSalaryPaid.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{t('salary_payments_footer', { count: rangeSalaries.length })}</p>
                </CardContent>
              </Card>
               <Card as="button" onClick={() => setMonthlyDueReportOpen(true)} className="text-left hover:bg-muted/50 transition-colors" disabled={rangeStats.totalDue <= 0}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('total_due_card_title')}</CardTitle>
                  <BadgeIndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">৳ {rangeStats.totalDue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{t('from_this_range_footer')}</p>
                </CardContent>
              </Card>
               <Card as="button" onClick={() => setMonthlyUnitsSoldReportOpen(true)} className="text-left hover:bg-muted/so transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('total_units_sold_card_title')}</CardTitle>
                  <Container className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     <div className="flex items-baseline gap-2">
                        <div className="text-xl font-bold">{rangeStats.materialSoldKg.toFixed(2)}</div>
                        <span className="text-xs text-muted-foreground">kg</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-xl font-bold">{rangeStats.hardwareSoldPcs}</div>
                        <span className="text-xs text-muted-foreground">pcs</span>
                      </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('profit_card_title')}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${rangeStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ৳ {rangeStats.profit.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('profit_formula_footer')}</p>
                </CardContent>
              </Card>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
              <CardHeader>
              <CardTitle>{t('daily_sales_chart_title', { range: rangeTitle })}</CardTitle>
              <CardDescription>{t('daily_sales_chart_description')}</CardDescription>
              </CardHeader>
              <CardContent>
              <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                  <BarChart data={salesChartData}>
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
                  <CardTitle>{t('daily_expenses_chart_title', { range: rangeTitle })}</CardTitle>
                  <CardDescription>{t('daily_expenses_chart_description')}</CardDescription>
              </CardHeader>
              <CardContent>
                  <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                      <BarChart data={expensesChartData}>
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

      {/* Daily Report Dialogs */}
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
      <DailyAttendanceReportDialog
        open={isDailyAttendanceReportOpen}
        onOpenChange={setDailyAttendanceReportOpen}
        attendance={todayAttendance}
        employees={employees}
      />

      {/* Monthly/Date Range Report Dialogs */}
      <MonthlySalesDialog
        open={isMonthlySalesReportOpen}
        onOpenChange={setMonthlySalesReportOpen}
        invoices={rangeInvoices}
        dateRange={dateRange}
      />
      <MonthlyExpensesDialog
        open={isMonthlyExpensesReportOpen}
        onOpenChange={setMonthlyExpensesReportOpen}
        expenses={rangeExpenses}
        dateRange={dateRange}
      />
      <MonthlyDueDialog
        open={isMonthlyDueReportOpen}
        onOpenChange={setMonthlyDueReportOpen}
        invoices={rangeInvoices}
        dateRange={dateRange}
      />
      <MonthlyUnitsSoldDialog
        open={isMonthlyUnitsSoldReportOpen}
        onOpenChange={setMonthlyUnitsSoldReportOpen}
        invoices={rangeInvoices}
        products={products}
        dateRange={dateRange}
      />
      <MonthlySalaryReportDialog
        open={isMonthlySalaryReportOpen}
        onOpenChange={setMonthlySalaryReportOpen}
        salaryPayments={rangeSalaries}
        employees={employees}
        dateRange={dateRange}
      />
    </>
  );
}

    