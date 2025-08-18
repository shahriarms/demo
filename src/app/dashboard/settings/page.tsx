
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSettings } from '@/hooks/use-settings';
import type { PrintFormat, Locale, POSPrinterType } from '@/lib/types';
import { Printer, Receipt, Usb, Wifi, Ban, Percent, Download, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { exportAllData, importAllData } from '@/lib/actions/data-actions';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


export default function SettingsPage() {
    const { settings, updateSettings } = useSettings();
    const { user } = useUser();
    const { t } = useTranslation();
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImportAlertOpen, setImportAlertOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePrintFormatChange = (value: string) => {
        updateSettings({ printFormat: value as PrintFormat });
    };

    const handlePosPrinterTypeChange = (value: string) => {
        updateSettings({ posPrinterType: value as POSPrinterType });
    }

    const handleLocaleChange = (value: string) => {
        updateSettings({ locale: value as Locale });
    }

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const data = await exportAllData();
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `stockpilot_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            toast({ title: "Export Successful", description: "All data has been exported." });
        } catch (error) {
            console.error("Export failed:", error);
            toast({ variant: "destructive", title: "Export Failed", description: "Could not export data." });
        } finally {
            setIsExporting(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleImportClick = () => {
        if (selectedFile && user?.role === 'admin') {
            setImportAlertOpen(true);
        } else if (user?.role !== 'admin') {
            toast({ variant: "destructive", title: "Access Denied", description: "Only admins can import data." });
        } else {
            toast({ title: "No File Selected", description: "Please select a backup file to import." });
        }
    };
    
    const confirmImport = async () => {
        if (!selectedFile) return;
        setIsImporting(true);
        setImportAlertOpen(false);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const data = JSON.parse(content);
                await importAllData(data);
                toast({ title: "Import Successful", description: "All data has been restored from the backup." });
                // Optional: force a reload to reflect all changes across the app
                window.location.reload();
            } catch (error) {
                console.error("Import failed:", error);
                toast({ variant: "destructive", title: "Import Failed", description: "Could not import data. The file might be corrupted or in the wrong format." });
            } finally {
                setIsImporting(false);
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };
        reader.readAsText(selectedFile);
    };


    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">{t('settings_page_title')}</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Percent /> Default Profit Margins</CardTitle>
                    <CardDescription>Set the default profit margins for different product categories.</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="material-margin">Material Profit Margin (%)</Label>
                        <Input 
                            id="material-margin" 
                            type="number"
                            placeholder="e.g., 15"
                            value={settings.materialProfitMargin}
                            onChange={(e) => updateSettings({ materialProfitMargin: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="hardware-margin">Hardware Profit Margin (%)</Label>
                        <Input 
                            id="hardware-margin" 
                            type="number"
                            placeholder="e.g., 25"
                            value={settings.hardwareProfitMargin}
                            onChange={(e) => updateSettings({ hardwareProfitMargin: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                </CardContent>
            </Card>

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
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>Export all your application data to a single file for backup, or import a file to restore your application state.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={handleExport} disabled={isExporting || user?.role !== 'admin'} className="flex-1">
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Export All Data
                        </Button>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="import-file">Import Data File (.json)</Label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input
                                id="import-file"
                                type="file"
                                accept=".json"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                disabled={isImporting || user?.role !== 'admin'}
                                className="flex-1"
                            />
                            <Button onClick={handleImportClick} disabled={isImporting || !selectedFile || user?.role !== 'admin'} className="w-full sm:w-auto">
                                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Import Data
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
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

            <AlertDialog open={isImportAlertOpen} onOpenChange={setImportAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                           <AlertCircle className="text-destructive h-6 w-6"/> Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all current data from the database and replace it with the data from the backup file. Please confirm you want to proceed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmImport} className="bg-destructive hover:bg-destructive/90">
                            Yes, import data
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
