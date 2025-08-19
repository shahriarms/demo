
'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { StockPilotLogo } from './stock-pilot-logo';
import { LayoutDashboard, Package, FileText, Users, HandCoins, Receipt, UserCog, Wallet, Settings } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

// This component is now obsolete as the sidebar has been replaced by a top navigation bar.
// It is kept for potential future reference but is no longer used in the main layout.

export function ObsoleteProviders({
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

  // The original sidebar code is preserved here but commented out
  // to reflect the UI change to a top navigation bar.
  return (
      <div>
        {header}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
  );
}
