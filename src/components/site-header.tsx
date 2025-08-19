
'use client';
import { Button } from '@/components/ui/button';
import { UserCircle, LogOut, Settings, LifeBuoy, KeyRound, Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/hooks/use-user';
import { useState } from 'react';
import { RedeemAdminCodeDialog } from './redeem-admin-code-dialog';
import { ShowAdminCodeDialog } from './show-admin-code-dialog';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/hooks/use-translation';
import { useSettings } from '@/hooks/use-settings';
import type { Locale } from '@/lib/types';
import Link from 'next/link';
import { StockPilotLogo } from './stock-pilot-logo';

const LiveClock = dynamic(() => import('./live-clock').then(mod => mod.LiveClock), {
  ssr: false,
});


export function SiteHeader() {
  const { user, logout, generateAdminCode, adminCode } = useUser();
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();

  const [isRedeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [isShowCodeDialogOpen, setShowCodeDialogOpen] = useState(false);


  const handleShowCode = () => {
    generateAdminCode();
    setShowCodeDialogOpen(true);
  }

  const handleLocaleChange = (value: string) => {
    updateSettings({ locale: value as Locale });
  }

  if (!user) {
    return (
       <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-center gap-4 border-b bg-card px-4 sm:px-6">
        <div className="flex items-center gap-2">
            <StockPilotLogo className="w-10 h-10" />
            <h1 className="text-xl font-semibold">
              <span className="text-foreground">Stock</span>
              <span className="text-primary">Pilot</span>
            </h1>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 sm:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
            <LiveClock />
        </div>

        {/* Center Section */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/dashboard" className="flex items-center gap-2">
                <StockPilotLogo className="w-10 h-10" />
                <h1 className="text-xl font-semibold hidden md:block">
                  <span className="text-foreground">Stock</span>
                  <span className="text-primary">Pilot</span>
                </h1>
            </Link>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle className="h-6 w-6" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div>{t('my_account_label')}</div>
                  <div className="text-xs font-normal text-muted-foreground">{user.email} ({t(`role_${user.role}` as any)})</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Languages className="mr-2 h-4 w-4" />
                    <span>{t('language_label')}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={settings.locale} onValueChange={handleLocaleChange}>
                          <DropdownMenuRadioItem value="en">{t('language_english')}</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="bn">{t('language_bengali')}</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                {user.role === 'admin' ? (
                  <DropdownMenuItem onClick={handleShowCode}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    {t('generate_admin_code_button')}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setRedeemDialogOpen(true)}>
                     <KeyRound className="mr-2 h-4 w-4" />
                    {t('redeem_admin_code_button')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <Link href="/dashboard/settings">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    {t('settings_label')}
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem>
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  {t('support_label')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('logout_button')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      <RedeemAdminCodeDialog
        open={isRedeemDialogOpen}
        onOpenChange={setRedeemDialogOpen}
      />
      <ShowAdminCodeDialog
        open={isShowCodeDialogOpen}
        onOpenChange={setShowCodeDialogOpen}
        code={adminCode}
      />
    </>
  );
}
