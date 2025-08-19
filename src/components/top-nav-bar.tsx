
'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  HandCoins,
  Receipt,
  UserCog,
  Wallet,
  Settings,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';


const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'dashboard_sidebar' },
  { href: '/dashboard/products', icon: Package, labelKey: 'products_sidebar' },
  { href: '/dashboard/invoice', icon: FileText, labelKey: 'invoice_sidebar' },
  { href: '/dashboard/buyers', icon: Users, labelKey: 'buyer_purchases_sidebar' },
  { href: '/dashboard/buyers-due', icon: HandCoins, labelKey: 'buyers_due_sidebar' },
  { href: '/dashboard/expenses', icon: Receipt, labelKey: 'expenses_sidebar' },
  { href: '/dashboard/employees', icon: UserCog, labelKey: 'employee_attendance_sidebar' },
  { href: '/dashboard/salaries', icon: Wallet, labelKey: 'salaries_sidebar' },
  { href: '/dashboard/settings', icon: Settings, labelKey: 'settings_sidebar' },
] as const;

export function TopNavBar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="sticky top-16 z-10 bg-card border-b">
      <div className="flex justify-center items-center gap-2 sm:gap-4 px-4 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link href={item.href}>
                  <div className="flex flex-col items-center gap-1 py-2 px-2 sm:px-4 relative">
                    <Icon className={cn(
                        "h-6 w-6 transition-colors",
                        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    )} />
                    <span className="sr-only">{t(item.labelKey)}</span>
                    {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                    )}
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t(item.labelKey)}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </nav>
  );
}
