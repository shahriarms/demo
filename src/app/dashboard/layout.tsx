

'use client';
import { UserProvider } from '@/hooks/use-user.tsx';
import { SiteHeader } from '@/components/site-header';
import { SettingsProvider } from '@/hooks/use-settings';
import { TranslationProvider } from '@/hooks/use-translation';
import { DataProvider } from '@/hooks/use-app-data';
import { TopNavBar } from '@/components/top-nav-bar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { InvoiceFormProvider } from '@/hooks/use-invoice-form';
import 'react-dom';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <SettingsProvider>
        <TranslationProvider>
          <DataProvider>
            <InvoiceFormProvider>
              <TooltipProvider>
                <div className="flex flex-col h-svh">
                  <SiteHeader />
                  <TopNavBar />
                  <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-muted/30">
                    {children}
                  </main>
                </div>
              </TooltipProvider>
            </InvoiceFormProvider>
          </DataProvider>
        </TranslationProvider>
      </SettingsProvider>
    </UserProvider>
  );
}
