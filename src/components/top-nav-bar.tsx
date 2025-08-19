
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
import { useIsMobile } from '@/hooks/use-mobile';


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
  const isMobile = useIsMobile();

  return (
    <nav className="sticky top-16 z-10 bg-card border-b shadow-sm">
      <div className="flex justify-center items-center gap-1 sm:gap-2 px-2 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 rounded-md p-2 text-center transition-all duration-200 ease-in-out transform hover:bg-muted/50 sm:hover:scale-105",
                     isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                     isMobile ? 'w-16 h-16' : 'w-24 h-20'
                  )}
                >
                    <Icon className={cn("h-6 w-6 sm:h-7 sm:w-7 transition-colors", isActive && 'text-primary')} />
                    {!isMobile && (
                        <span className={cn("text-xs font-medium truncate transition-colors", isActive ? 'text-primary' : 'text-muted-foreground')}>
                            {t(item.labelKey)}
                        </span>
                    )}
                    {isActive && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-1 bg-primary rounded-t-full" />
                    )}
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
