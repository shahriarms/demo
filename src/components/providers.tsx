
'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { StockPilotLogo } from './stock-pilot-logo';
import { LayoutDashboard, Package, FileText, Users, HandCoins, Receipt, UserCog, Wallet, Settings } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export function Providers({
  children,
  header,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();

  if (pathname === '/login' || pathname === '/signup') {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <StockPilotLogo className="w-10 h-10 transition-all duration-200" />
            <h1 className="text-xl font-semibold transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0">
              <span className="text-foreground">Stock</span>
              <span className="text-primary">Pilot</span>
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard">
                <SidebarMenuButton
                  isActive={pathname === '/dashboard'}
                  tooltip={{ children: t('dashboard_sidebar') }}
                >
                  <LayoutDashboard />
                  <span>{t('dashboard_sidebar')}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/dashboard/products">
                <SidebarMenuButton
                  isActive={pathname.startsWith('/dashboard/products')}
                  tooltip={{ children: t('products_sidebar') }}
                >
                   <Package />
                  <span>{t('products_sidebar')}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/dashboard/invoice">
                <SidebarMenuButton
                  isActive={pathname.startsWith('/dashboard/invoice')}
                  tooltip={{ children: t('invoice_sidebar') }}
                >
                   <FileText />
                  <span>{t('invoice_sidebar')}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <Link href="/dashboard/buyers">
                <SidebarMenuButton
                  isActive={pathname === '/dashboard/buyers'}
                  tooltip={{ children: t('buyer_purchases_sidebar') }}
                >
                   <Users />
                  <span>{t('buyer_purchases_sidebar')}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/dashboard/buyers-due">
                <SidebarMenuButton
                  isActive={pathname.startsWith('/dashboard/buyers-due')}
                  tooltip={{ children: t('buyers_due_sidebar') }}
                >
                   <HandCoins />
                  <span>{t('buyers_due_sidebar')}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/dashboard/expenses">
                <SidebarMenuButton
                  isActive={pathname.startsWith('/dashboard/expenses')}
                  tooltip={{ children: t('expenses_sidebar') }}
                >
                   <Receipt />
                  <span>{t('expenses_sidebar')}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <Link href="/dashboard/employees">
                <SidebarMenuButton
                  isActive={pathname.startsWith('/dashboard/employees')}
                  tooltip={{ children: t('employee_attendance_sidebar') }}
                >
                   <UserCog />
                  <span>{t('employee_attendance_sidebar')}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <Link href="/dashboard/salaries">
                <SidebarMenuButton
                  isActive={pathname.startsWith('/dashboard/salaries')}
                  tooltip={{ children: t('salaries_sidebar') }}
                >
                   <Wallet />
                  <span>{t('salaries_sidebar')}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                 <SidebarMenuItem>
                    <Link href="/dashboard/settings">
                        <SidebarMenuButton
                        isActive={pathname.startsWith('/dashboard/settings')}
                        tooltip={{ children: t('settings_sidebar') }}
                        >
                        <Settings />
                        <span>{t('settings_sidebar')}</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-svh">
          {header}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
