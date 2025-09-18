
'use client';
import { Button } from '@/components/ui/button';
import { UserCircle, LogOut, Settings, KeyRound, Languages, Camera } from 'lucide-react';
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
import { useState, useRef } from 'react';
import { RedeemAdminCodeDialog } from './redeem-admin-code-dialog';
import { ShowAdminCodeDialog } from './show-admin-code-dialog';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/hooks/use-translation';
import { useSettings } from '@/hooks/use-settings';
import type { Locale } from '@/lib/types';
import Link from 'next/link';
import { StockPilotLogo } from './stock-pilot-logo';
import { DatabaseStatus } from './database-status';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const LiveClock = dynamic(() => import('./live-clock').then(mod => mod.LiveClock), {
  ssr: false,
});


export function SiteHeader() {
  const { user, logout, generateAdminCode, adminCode, updateProfilePicture } = useUser();
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();

  const [isRedeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [isShowCodeDialogOpen, setShowCodeDialogOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleShowCode = () => {
    generateAdminCode();
    setShowCodeDialogOpen(true);
  }

  const handleLocaleChange = (value: string) => {
    updateSettings({ locale: value as Locale });
  }

  const handlePictureChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updateProfilePicture(file);
    }
  };
  
  const getInitials = (email: string | null) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  if (!user) {
    return (
       <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-center gap-4 border-b bg-card px-4 sm:px-6">
        <div className="flex items-center gap-2">
            <StockPilotLogo className="w-10 h-10" />
            <h1 className="text-xl font-semibold">
              <span className="text-foreground">Mahmud Engineering Shop</span>
            </h1>
        </div>
      </header>
    );
  }

  return (
    <>
      <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg"
        />
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 sm:px-6">
        {/* Left Section: Logo and Title */}
        <Link href="/dashboard" className="flex items-center gap-2">
            <StockPilotLogo className="w-8 h-8" />
            <h1 className="text-base sm:text-xl font-semibold">
                <span className="text-foreground">Mahmud Engineering Shop</span>
            </h1>
        </Link>
        
        {/* Right Section: Status, Clock, and User Menu */}
        <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex"><DatabaseStatus /></div>
            <div className="hidden sm:flex"><LiveClock /></div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar>
                        <AvatarImage src={user.photoURL || undefined} alt="User profile picture" />
                        <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div>{t('my_account_label')}</div>
                  <div className="text-xs font-normal text-muted-foreground">{user.email} ({t(`role_${user.role}` as any)})</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={handlePictureChangeClick}>
                    <Camera className="mr-2 h-4 w-4" />
                    <span>Change Picture</span>
                </DropdownMenuItem>
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
