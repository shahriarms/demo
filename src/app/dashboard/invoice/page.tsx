
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppData } from '@/hooks/use-app-data';
import { Plus, Trash2, Printer, X, Loader2, Search, RotateCcw } from 'lucide-react';
import { useInvoiceForm } from '@/hooks/use-invoice-form';
import { useToast } from '@/hooks/use-toast';
import { InvoicePrintLayout } from '@/components/invoice-print-layout';
import { useSettings } from '@/hooks/use-settings';
import { useTranslation } from '@/hooks/use-translation';
import type { DraftInvoice } from '@/hooks/use-invoice-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Product } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';


export default function InvoicePage() {
  const { addInvoice } = useAppData();
  const { settings } = useSettings();
  const { toast } = useToast();
  const { t } = useTranslation();

  const {
    drafts,
    activeDraftIndex,
    setActiveDraftIndex,
    activeDraft,
    addNewDraft,
    removeDraft,
    updateActiveDraft,
    updateInvoiceItem,
    removeInvoiceItem,
    addInvoiceItem,
    resetActiveDraft,
    isFormLoading,
    products
  } = useInvoiceForm();
  
  const [draftToDelete, setDraftToDelete] = useState<DraftInvoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPrintConfirmOpen, setPrintConfirmOpen] = useState(false);
  
  const { id: draftId, customerName, customerAddress, customerPhone, paidAmount, subtotal, dueAmount, items, cashReceived, changeAmount } = activeDraft || {};

  const validateInvoice = () => {
    if (!customerName) {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('customer_name_required_error') });
      return false;
    }
    if (!items || items.length === 0) {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('invoice_items_required_error') });
      return false;
    }
    return true;
  };
  
  const handlePrintConfirm = () => {
     if (!validateInvoice() || isProcessing) return;
     setPrintConfirmOpen(true);
  };
  
  const handleSaveAndPrint = async () => {
    if (!validateInvoice() || !activeDraft || isProcessing) return;

    setPrintConfirmOpen(false);
    setIsProcessing(true);

    try {
        const newInvoiceId = await addInvoice(activeDraft);
        
        if (newInvoiceId) {
            toast({
              title: t('invoice_saved_toast_title'),
              description: t('invoice_saved_toast_description', { invoiceId: newInvoiceId }),
            });
            
            // This is a crucial step. We update the draft with the final ID
            // so the printed version has the correct invoice number.
            updateActiveDraft({id: newInvoiceId});

            // We need a short delay to allow React to re-render the print layout with the new ID.
            await new Promise(resolve => setTimeout(resolve, 50));
            
            window.print();
        }
    } catch (error: any) {
        console.error("Failed to save or print invoice:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Failed to save or print the invoice.',
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleReset = () => {
    resetActiveDraft();
    toast({
        title: "Memo Reset",
        description: "A new, empty memo is ready for you.",
    });
  }

  const [mainCategoryFilter, setMainCategoryFilter] = useState<'Material' | 'Hardware'>('Material');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');

  const [categorySearch, setCategorySearch] = useState('');
  const [subCategorySearch, setSubCategorySearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  
  const resetFilters = () => {
    setCategoryFilter('');
    setSubCategoryFilter('');
    productSearch && setProductSearch('');
    categorySearch && setCategorySearch('');
    subCategorySearch && setSubCategorySearch('');
  };
  
  useEffect(() => {
    resetFilters();
  }, [mainCategoryFilter]);
  
  useEffect(() => {
    setSubCategoryFilter('');
    setSubCategorySearch('');
  }, [categoryFilter]);

  const categories = useMemo(() => {
    const allCategories = [...new Set(products.filter(p => p.mainCategory === mainCategoryFilter).map(p => p.category))];
    if (!categorySearch) return allCategories;
    return allCategories.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase()));
  }, [products, mainCategoryFilter, categorySearch]);
  
  const subCategories = useMemo(() => {
    const allSubCategories = [...new Set(products.filter(p => p.mainCategory === mainCategoryFilter && p.category === categoryFilter).map(p => p.subCategory))];
     if (!subCategorySearch) return allSubCategories;
    return allSubCategories.filter(sc => sc.toLowerCase().includes(subCategorySearch.toLowerCase()));
  }, [products, mainCategoryFilter, categoryFilter, subCategorySearch]);

  const filteredProducts = useMemo(() => {
    let prods = products
      .filter(p => p.mainCategory === mainCategoryFilter)
      .filter(p => categoryFilter ? p.category === categoryFilter : true)
      .filter(p => subCategoryFilter ? p.subCategory === subCategoryFilter : true);

    if (productSearch) {
      prods = prods.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
    }
    return prods;
  }, [products, mainCategoryFilter, categoryFilter, subCategoryFilter, productSearch]);

  const handleAddProduct = (product: Product) => {
    addInvoiceItem(product);
  };
  
  const handleDeleteDraftClick = (draft: DraftInvoice) => {
    if (drafts.length <= 1) {
        toast({
            variant: 'destructive',
            title: "Cannot Delete",
            description: "You cannot delete the last remaining memo.",
        });
        return;
    }
    setDraftToDelete(draft);
  };
  
  const confirmDeleteDraft = () => {
    if (draftToDelete) {
        removeDraft(draftToDelete.id);
        setDraftToDelete(null);
    }
  };
  
  if (isFormLoading || !activeDraft) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 no-print">
          {/* Memo Tabs */}
          <div className="flex items-center gap-2 border-b pb-2 flex-wrap">
              {drafts.map((draft, index) => (
                  <div key={draft.id} className="relative group">
                      <Button 
                          variant={index === activeDraftIndex ? 'secondary' : 'ghost'}
                          onClick={() => setActiveDraftIndex(index)}
                          className="pr-8"
                      >
                          {draft.label}
                      </Button>
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 opacity-50 group-hover:opacity-100"
                          onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDraftClick(draft);
                          }}
                      >
                          <X className="h-4 w-4" />
                      </Button>
                  </div>
              ))}
              <Button variant="outline" size="icon" onClick={addNewDraft} disabled={drafts.length >= 10}>
                  <Plus className="h-4 w-4"/>
              </Button>
          </div>

          {/* Change Calculator */}
          <div className="py-4">
              <Card>
                  <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                      <div className="text-center sm:text-left">
                          <p className="text-sm text-muted-foreground">Total Bill</p>
                          <p className="text-2xl font-bold">৳{(subtotal || 0).toFixed(2)}</p>
                      </div>
                      <Separator orientation={"vertical"} className={'w-px h-10 hidden sm:block'} />
                      <Separator orientation={"horizontal"} className={'h-px w-full sm:hidden'} />
                      <div className="flex items-center gap-2">
                          <Label htmlFor="cashReceived" className="text-sm font-medium">Cash Received:</Label>
                          <div className="relative w-40">
                               <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">৳</span>
                               <Input 
                                  id='cashReceived' 
                                  type="text"
                                  inputMode='decimal'
                                  value={cashReceived ?? ''} 
                                  onChange={e => updateActiveDraft({ cashReceived: parseFloat(e.target.value) || undefined })} 
                                  className="pl-5 text-right font-bold text-lg h-11"
                                  placeholder='0'
                              />
                          </div>
                      </div>
                      <Separator orientation={"vertical"} className={'w-px h-10 hidden sm:block'} />
                      <Separator orientation={"horizontal"} className={'h-px w-full sm:hidden'} />
                      <div className="text-center sm:text-left">
                          <p className="text-sm text-muted-foreground">Change</p>
                          <p className="text-2xl font-bold text-green-600">৳{(changeAmount || 0).toFixed(2)}</p>
                      </div>
                  </CardContent>
              </Card>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Column 1: Customer Info & Product Adder */}
            <div className="flex flex-col gap-4">
              <Card>
                  <CardHeader>
                      <CardTitle>{activeDraft.label}</CardTitle>
                      <CardDescription>{t('invoice_no_label')}: {draftId}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label htmlFor="customerName">{t('customer_name_label')}</Label>
                              <Input id="customerName" placeholder={t('customer_name_placeholder')} value={customerName || ''} onChange={(e) => updateActiveDraft({ customerName: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="customerPhone">{t('customer_phone_label')}</Label>
                              <Input id="customerPhone" placeholder={t('customer_phone_placeholder')} value={customerPhone || ''} onChange={(e) => updateActiveDraft({ customerPhone: e.target.value })} />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="customerAddress">{t('customer_address_label')}</Label>
                          <Input id="customerAddress" placeholder={t('customer_address_placeholder')} value={customerAddress || ''} onChange={(e) => updateActiveDraft({ customerAddress: e.target.value })} />
                      </div>
                  </CardContent>
              </Card>

              <Card className="flex-1 flex flex-col">
                  <CardHeader>
                      <CardTitle>{t('add_products_label')}</CardTitle>
                      <RadioGroup
                          value={mainCategoryFilter}
                          onValueChange={(value) => setMainCategoryFilter(value as 'Material' | 'Hardware')}
                          className="flex space-x-4 pt-2"
                      >
                          <div className="flex items-center space-x-2"><RadioGroupItem value="Material" id="r-material" /><Label htmlFor="r-material">{t('material_tab')}</Label></div>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="Hardware" id="r-hardware" /><Label htmlFor="r-hardware">{t('hardware_tab')}</Label></div>
                      </RadioGroup>
                  </CardHeader>
                  <CardContent className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* Category List */}
                          <div className="flex flex-col gap-2">
                             <Label>{t('category_header')}</Label>
                              <div className="relative">
                                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                 <Input placeholder="Search..." className="pl-8 h-9" value={categorySearch} onChange={e => setCategorySearch(e.target.value)} />
                              </div>
                             <ScrollArea className="border rounded-md flex-1">
                                 <div className="p-2 space-y-1">
                                      <Button variant={!categoryFilter ? 'secondary' : 'ghost'} className="w-full justify-start h-8 text-xs" onClick={() => setCategoryFilter('')}>{t('all_categories')}</Button>
                                      {categories.map(c => <Button key={c} variant={categoryFilter === c ? 'secondary' : 'ghost'} className="w-full justify-start h-8 text-xs" onClick={() => setCategoryFilter(c)}>{c}</Button>)}
                                 </div>
                             </ScrollArea>
                          </div>
                          {/* Sub-Category List */}
                          <div className="flex flex-col gap-2">
                              <Label>{t('subcategory_header')}</Label>
                              <div className="relative">
                                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                 <Input placeholder="Search..." className="pl-8 h-9" value={subCategorySearch} onChange={e => setSubCategorySearch(e.target.value)} disabled={!categoryFilter}/>
                              </div>
                             <ScrollArea className="border rounded-md flex-1">
                                  <div className="p-2 space-y-1">
                                       <Button variant={!subCategoryFilter ? 'secondary' : 'ghost'} className="w-full justify-start h-8 text-xs" onClick={() => setSubCategoryFilter('')} disabled={!categoryFilter}>{t('all_subcategories')}</Button>
                                       {categoryFilter && subCategories.map(sc => <Button key={sc} variant={subCategoryFilter === sc ? 'secondary' : 'ghost'} className="w-full justify-start h-8 text-xs" onClick={() => setSubCategoryFilter(sc)}>{sc}</Button>)}
                                  </div>
                             </ScrollArea>
                          </div>
                          {/* Product List */}
                           <div className="flex flex-col gap-2">
                              <Label>{t('products_sidebar')}</Label>
                              <div className="relative">
                                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                 <Input placeholder="Search..." className="pl-8 h-9" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                              </div>
                             <ScrollArea className="border rounded-md flex-1">
                                  <div className="p-2 space-y-1">
                                       {filteredProducts.map(p => <Button key={p.id} variant="ghost" className="w-full justify-start h-8 text-xs" onClick={() => handleAddProduct(p)}>{p.name}</Button>)}
                                  </div>
                             </ScrollArea>
                          </div>
                  </CardContent>
              </Card>
            </div>

            {/* Column 2: Invoice Items & Preview */}
            <div className="lg:col-span-2 space-y-4">
                <Card className="flex flex-col">
                  <CardHeader>
                      <CardTitle>Invoice Items</CardTitle>
                  </CardHeader>
                  <CardContent className='p-0 flex-1'>
                      <ScrollArea className="h-full max-h-96">
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Item</TableHead>
                                      <TableHead className="w-24">Qty</TableHead>
                                      <TableHead className="w-32 hidden sm:table-cell">Price</TableHead>
                                      <TableHead className="text-right w-32">Total</TableHead>
                                      <TableHead className="w-12"></TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {items && items.length > 0 ? items.map(item => (
                                      <TableRow key={item.id}>
                                          <TableCell>
                                              <p className="font-medium">{item.name}</p>
                                              <p className='text-xs text-muted-foreground'>Suggested: ৳{(item.originalPrice || 0).toFixed(2)}</p>
                                          </TableCell>
                                          <TableCell>
                                              <Input type="text" inputMode="decimal" value={item.quantity} onChange={e => updateInvoiceItem(item.id, { quantity: parseInt(e.target.value) || 0 })} className="h-9" />
                                          </TableCell>
                                          <TableCell className="hidden sm:table-cell">
                                              <div className="relative flex items-center">
                                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm">৳</span>
                                                  <Input type="text" inputMode="decimal" value={item.price} onChange={e => updateInvoiceItem(item.id, { price: parseFloat(e.target.value) || 0 })} className="pl-5 text-right font-medium h-9" />
                                              </div>
                                          </TableCell>
                                          <TableCell className="text-right font-semibold">৳{(item.price * item.quantity).toFixed(2)}</TableCell>
                                          <TableCell>
                                              <Button variant="ghost" size="icon" onClick={() => removeInvoiceItem(item.id)} className="h-9 w-9">
                                                  <Trash2 className="w-4 h-4 text-destructive" />
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  )) : (
                                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No items added yet.</TableCell></TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      </ScrollArea>
                  </CardContent>
                  <CardFooter className="flex-col items-stretch space-y-2 pt-4">
                      <div className="w-full md:w-80 ml-auto space-y-2">
                      <div className="flex justify-between items-center text-sm">
                          <span className='text-muted-foreground'>{t('subtotal_label')}</span>
                          <span className="font-medium">৳{(subtotal ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <Label htmlFor='paidAmount' className="shrink-0 text-muted-foreground text-sm">{t('paid_label')}</Label>
                          <div className="relative w-32">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">৳</span>
                                  <Input 
                                      id='paidAmount' 
                                      type="text"
                                      inputMode='decimal'
                                      value={paidAmount ?? ''} 
                                      onChange={e => updateActiveDraft({ paidAmount: parseFloat(e.target.value) || undefined })} 
                                      className="h-9 pl-5 text-right font-medium"
                                      placeholder='0'
                                  />
                          </div>
                      </div>
                      <div className="flex justify-between items-center font-bold text-base border-t pt-2 mt-2">
                          <span>{t('due_label')}</span>
                          <span>৳{(dueAmount ?? 0).toFixed(2)}</span>
                      </div>
                      </div>
                  </CardFooter>
                </Card>

                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle>{t('live_print_preview_title')}</CardTitle>
                         <div className="flex gap-2">
                            <Button onClick={handlePrintConfirm} disabled={!items || items.length === 0 || isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4"/>} 
                                {isProcessing ? 'Processing...' : t('save_and_print_button')}
                            </Button>
                            <Button onClick={handleReset} variant="outline">
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reset
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 bg-muted/50 rounded-lg overflow-auto">
                        <div className="transform scale-[0.9] origin-top">
                            {activeDraft && <InvoicePrintLayout 
                                invoiceId={activeDraft.id}
                                currentDate={new Date().toLocaleDateString()}
                                customerName={activeDraft.customerName}
                                customerAddress={activeDraft.customerAddress}
                                customerPhone={activeDraft.customerPhone}
                                invoiceItems={activeDraft.items}
                                subtotal={activeDraft.subtotal}
                                paidAmount={activeDraft.paidAmount || 0}
                                dueAmount={activeDraft.dueAmount}
                                printFormat={settings.printFormat}
                                locale={settings.locale}
                            />}
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
      </div>
      <div className="print-source">
          {activeDraft && <InvoicePrintLayout 
              invoiceId={activeDraft.id}
              currentDate={new Date().toLocaleDateString()}
              customerName={activeDraft.customerName}
              customerAddress={activeDraft.customerAddress}
              customerPhone={activeDraft.customerPhone}
              invoiceItems={activeDraft.items}
              subtotal={activeDraft.subtotal}
              paidAmount={activeDraft.paidAmount || 0}
              dueAmount={activeDraft.dueAmount}
              printFormat={settings.printFormat}
              locale={settings.locale}
          />}
      </div>

      <AlertDialog open={!!draftToDelete} onOpenChange={() => setDraftToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>{t('are_you_sure_title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                     Are you sure you want to delete this memo? This action cannot be undone.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel_button')}</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDeleteDraft} className="bg-destructive hover:bg-destructive/90">{t('delete_button')}</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isPrintConfirmOpen} onOpenChange={setPrintConfirmOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Print</AlertDialogTitle>
                  <AlertDialogDescription>
                     Are you sure you want to save and print this invoice? This will finalize the invoice.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSaveAndPrint}>
                     Yes, Print
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    