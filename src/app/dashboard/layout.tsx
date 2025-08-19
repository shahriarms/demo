
'use client';
import { UserProvider } from '@/hooks/use-user.tsx';
import { Providers } from '@/components/providers';
import { SiteHeader } from '@/components/site-header';
import { SettingsProvider } from '@/hooks/use-settings';
import { TranslationProvider } from '@/hooks/use-translation';
import { DataProvider } from '@/hooks/use-app-data';

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
            <Providers header={<SiteHeader />}>{children}</Providers>
          </DataProvider>
        </TranslationProvider>
      </SettingsProvider>
    </UserProvider>
  );
}
