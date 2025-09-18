
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSettings } from '@/hooks/use-settings';
import type { PrintFormat, Locale, POSPrinterType } from '@/lib/types';
import { Printer, Receipt, Usb, Wifi, Ban } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
    const { settings, updateSettings } = useSettings();
    const { t } = useTranslation();

    const handlePrintFormatChange = (value: string) => {
        updateSettings({ printFormat: value as PrintFormat });
    };

    const handlePosPrinterTypeChange = (value: string) => {
        updateSettings({ posPrinterType: value as POSPrinterType });
    }

    const handleLocaleChange = (value: string) => {
        updateSettings({ locale: value as Locale });
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">{t('settings_page_title')}</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>{t('print_settings_title')}</CardTitle>
                    <CardDescription>{t('print_settings_description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={settings.printFormat}
                        onValueChange={handlePrintFormatChange}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                        
                            <Label htmlFor="normal" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer">
                                <RadioGroupItem value="normal" id="normal" className="sr-only"/>
                                <Printer className="mb-3 h-6 w-6" />
                                {t('normal_a4_label')}
                            </Label>
                        
                            <Label htmlFor="pos" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer">
                                <RadioGroupItem value="pos" id="pos" className="sr-only" />
                                <Receipt className="mb-3 h-6 w-6" />
                                {t('pos_receipt_label')}
                            </Label>
                        
                    </RadioGroup>
                </CardContent>
            </Card>

            {settings.printFormat === 'pos' && (
                <Card>
                    <CardHeader>
                        <CardTitle>POS Printer Settings</CardTitle>
                        <CardDescription>Configure your thermal receipt printer connection.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <RadioGroup
                            value={settings.posPrinterType}
                            onValueChange={handlePosPrinterTypeChange}
                            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                        >
                            <Label htmlFor="type-disabled" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer">
                                <RadioGroupItem value="disabled" id="type-disabled" className="sr-only" />
                                <Ban className="mb-3 h-6 w-6" />
                                Disabled
                            </Label>
                             <Label htmlFor="type-usb" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer">
                                <RadioGroupItem value="usb" id="type-usb" className="sr-only"/>
                                <Usb className="mb-3 h-6 w-6" />
                                USB
                            </Label>
                            <Label htmlFor="type-network" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer">
                                <RadioGroupItem value="tcp" id="type-network" className="sr-only" />
                                <Wifi className="mb-3 h-6 w-6" />
                                Network (TCP)
                            </Label>
                        </RadioGroup>

                        {settings.posPrinterType === 'tcp' && (
                            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label htmlFor="host">Printer IP Address</Label>
                                    <Input 
                                        id="host" 
                                        placeholder="e.g., 192.168.1.123"
                                        value={settings.posPrinterHost || ''}
                                        onChange={(e) => updateSettings({ posPrinterHost: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="port">Port</Label>
                                    <Input 
                                        id="port" 
                                        type="number"
                                        placeholder="e.g., 9100"
                                        value={settings.posPrinterPort || ''}
                                        onChange={(e) => updateSettings({ posPrinterPort: parseInt(e.target.value) || 9100 })}
                                     />
                                </div>
                            </div>
                        )}
                        {settings.posPrinterType === 'usb' && (
                             <div className="pt-4 border-t text-sm text-muted-foreground">
                                For USB printing, ensure your printer is connected and configured correctly in your operating system. See the README for troubleshooting steps with tools like Zadig (Windows) or udev rules (Linux).
                             </div>
                        )}
                    </CardContent>
                </Card>
            )}
            
            <Card>
                <CardHeader>
                    <CardTitle>{t('language_settings_title')}</CardTitle>
                    <CardDescription>{t('language_settings_description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={settings.locale}
                        onValueChange={handleLocaleChange}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                        
                            <Label htmlFor="en" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer">
                                <RadioGroupItem value="en" id="en" className="sr-only"/>
                                <span className="font-bold text-lg mb-3">EN</span>
                                {t('language_english')}
                            </Label>
                        
                            <Label htmlFor="bn" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer">
                                <RadioGroupItem value="bn" id="bn" className="sr-only" />
                                <span className="font-bold text-lg mb-3">বাংলা</span>
                                {t('language_bengali')}
                            </Label>
                        
                    </RadioGroup>
                </CardContent>
            </Card>
        </div>
    );
}
