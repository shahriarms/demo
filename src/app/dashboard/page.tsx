
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { useAppData } from '@/hooks/use-app-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, TrendingDown, Calendar as CalendarIcon, UserCheck, Package, HandCoins, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function Dashboard() {
  const { getInvoicesForDateRange, getExpensesForDateRange, getAttendanceSummaryForDate, isAppDataLoading: isLoading } = useAppData();
  const { t } = useTranslation();

  const [date, setDate] = useState<Date>(new Date());
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  const [monthlyInvoices, setMonthlyInvoices] = useState<any[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<any[]>([]);
  const [todayInvoices, setTodayInvoices] = useState<any[]>([]);
  const [todayAttendanceSummary, setTodayAttendanceSummary] = useState({ present: 0, total: 0 });

  useEffect(() => {
    if (!isLoading) {
      setMonthlyInvoices(getInvoicesForDateRange(monthStart, monthEnd));
      setMonthlyExpenses(getExpensesForDateRange(monthStart, monthEnd));
      const today = new Date();
      setTodayInvoices(getInvoicesForDateRange(today, today));
      setTodayAttendanceSummary(getAttendanceSummaryForDate(today));
    }
  }, [isLoading, getInvoicesForDateRange, getExpensesForDateRange, getAttendanceSummaryForDate, date]);


  const monthlyStats = useMemo(() => {
    const totalSales = monthlyInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalExpenses = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const profit = totalSales - totalExpenses;
    return { totalSales, totalExpenses, profit };
  }, [monthlyInvoices, monthlyExpenses]);
  
  const todayStats = useMemo(() => {
      const totalSales = todayInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
      const totalDue = todayInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
      const unitsSold = todayInvoices.reduce((sum, inv) => sum + inv.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
      const presentEmployees = todayAttendanceSummary.present;
      return { totalSales, totalDue, unitsSold, presentEmployees };
  }, [todayInvoices, todayAttendanceSummary]);
  
  const dailySalesChartData = useMemo(() => {
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return daysInMonth.map(day => {
        const salesForDay = monthlyInvoices
            .filter(inv => isSameDay(new Date(inv.date), day))
            .reduce((sum, inv) => sum + inv.subtotal, 0);
        return {
            name: format(day, 'd'),
            Sales: salesForDay,
        };
    });
  }, [monthlyInvoices, monthStart, monthEnd]);
  
  const topSellingProductsData = useMemo(() => {
      const productSales: { [key: string]: { name: string, quantity: number } } = {};
      monthlyInvoices.forEach(invoice => {
          invoice.items.forEach(item => {
              if (productSales[item.id]) {
                  productSales[item.id].quantity += item.quantity;
              } else {
                  productSales[item.id] = { name: item.name, quantity: item.quantity };
              }
          });
      });
      return Object.values(productSales)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
  }, [monthlyInvoices]);


  const chartConfig: ChartConfig = {
    Sales: { label: t('sales_label'), color: "hsl(var(--primary))" },
    Profit: { label: t('profit_label'), color: "hsl(var(--chart-2))" },
    quantity: { label: t('quantity_label') },
  };

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('todays_sales_card_title')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${todayStats.totalSales.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{t('invoices_count_footer', { count: todayInvoices.length })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('todays_due_card_title')}</CardTitle>
                <HandCoins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${todayStats.totalDue.toFixed(2)}</div>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('monthly_sales_card_title')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyStats.totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{format(date, "MMMM yyyy")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('monthly_expenses_card_title')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyStats.totalExpenses.toFixed(2)}</div>
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
                ${monthlyStats.profit.toFixed(2)}
            </div>
             <p className="text-xs text-muted-foreground">{format(date, "MMMM yyyy")}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
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
         <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>{t('top_selling_products_chart_title')}</CardTitle>
                <CardDescription>{format(date, "MMMM yyyy")}</CardDescription>
            </CardHeader>
            <CardContent>
                {topSellingProductsData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                            <Pie
                                data={topSellingProductsData}
                                dataKey="quantity"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                labelLine={false}
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                    return (
                                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
                                            {`${(percent * 100).toFixed(0)}%`}
                                        </text>
                                    );
                                }}
                            >
                                {topSellingProductsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                ) : (
                    <div className="flex justify-center items-center min-h-[250px] text-muted-foreground">
                        {t('no_sales_data_for_month')}
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    