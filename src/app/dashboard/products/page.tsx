
'use client';

import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppData } from '@/hooks/use-app-data';
import type { Product } from '@/lib/types';
import { AddProductDialog } from '@/components/add-product-dialog';
import { EditProductDialog } from '@/components/edit-product-dialog';
import { Download, PlusCircle, MoreHorizontal, Loader2, PackageOpen, Pencil, ShieldAlert, Search, Upload, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/hooks/use-user';
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
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';


export default function ProductsPage() {
  const { products, isAppDataLoading, addMultipleProducts, deleteProduct } = useAppData();
  const { user } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showAdminAlert, setShowAdminAlert] = useState(false);
  const [activeTab, setActiveTab] = useState<'Material' | 'Hardware'>('Material');

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.mainCategory === activeTab)
      .filter(p => searchTerm ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) : true)
      .filter(p => categoryFilter ? p.category === categoryFilter : true)
      .filter(p => subCategoryFilter ? p.subCategory === subCategoryFilter : true);
  }, [products, activeTab, searchTerm, categoryFilter, subCategoryFilter]);

  const categories = useMemo(() => [...new Set(products.filter(p => p.mainCategory === activeTab).map(p => p.category).filter(Boolean))], [products, activeTab]);
  const subCategories = useMemo(() => {
    const relevantProducts = products.filter(p => p.mainCategory === activeTab && (!categoryFilter || p.category === categoryFilter));
    return [...new Set(relevantProducts.map(p => p.subCategory).filter(Boolean))];
  }, [products, activeTab, categoryFilter]);


  const handleDownload = () => {
    const headers = ["Main Category,Category,Sub-Category,SKU,Name,Buying Price,Profit Margin,Selling Price,Stock\n"];
    const csvContent = filteredProducts
      .map((p) => `${p.mainCategory},${p.category},${p.subCategory},${p.sku},"${p.name.replace(/"/g, '""')}",${p.buyingPrice},${p.profitMargin},${p.sellingPrice},${p.stock}`)
      .join("\n");
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `stock_report_${activeTab}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleEditClick = (product: Product) => {
    if (user?.role === 'admin') {
      setEditProduct(product);
    } else {
      setShowAdminAlert(true);
    }
  };
  
  const handleDeleteClick = (product: Product) => {
     if (user?.role === 'admin') {
      setProductToDelete(product);
    } else {
      setShowAdminAlert(true);
    }
  }

  const confirmDelete = () => {
    if(productToDelete && user?.role === 'admin') {
        deleteProduct(productToDelete.id);
        setProductToDelete(null);
    }
  }
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const newProducts: Omit<Product, 'id' | 'sellingPrice'>[] = json.map((row: any) => ({
          name: String(row['Name'] || ''),
          sku: String(row['SKU'] || ''),
          buyingPrice: parseFloat(String(row['Buying Price'] || 0)),
          profitMargin: parseFloat(String(row['Profit Margin'] || 0)),
          stock: parseInt(String(row['Stock'] || 0), 10),
          mainCategory: (row['Main Category'] === 'Hardware' ? 'Hardware' : 'Material') as 'Material' | 'Hardware',
          category: String(row['Category'] || ''),
          subCategory: String(row['Sub-Category'] || ''),
        })).filter(p => p.name && p.sku);

        if (newProducts.length > 0) {
          addMultipleProducts(newProducts);
          toast({
            title: t('upload_successful_toast_title'),
            description: t('upload_successful_toast_description', { count: newProducts.length }),
          });
        } else {
          toast({
            variant: 'destructive',
            title: t('upload_failed_toast_title'),
            description: t('upload_failed_toast_description'),
          });
        }
      } catch (error) {
        console.error("Error parsing uploaded file:", error);
        toast({
          variant: 'destructive',
          title: t('upload_error_toast_title'),
          description: t('upload_error_toast_description'),
        });
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset file input
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setSubCategoryFilter('');
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t('products_page_title')}</h1>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".xlsx, .xls, .csv"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isAppDataLoading || user?.role !== 'admin'}>
            <Upload className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t('upload_button')}</span>
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={isAppDataLoading || filteredProducts.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t('download_report_button')}</span>
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t('add_product_button')}</span>
          </Button>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value as 'Material' | 'Hardware');
        resetFilters();
      }}>
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="Material">{t('material_tab')}</TabsTrigger>
            <TabsTrigger value="Hardware">{t('hardware_tab')}</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
            <Card className="w-full flex-1 flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col gap-4">
                {/* Filter Section */}
                <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="search" 
                            placeholder={t('search_by_product_name_placeholder')}
                            className="pl-8" 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value === 'all' ? '' : value)}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder={t('filter_by_category_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">{t('all_categories')}</SelectItem>
                            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={subCategoryFilter} onValueChange={(value) => setSubCategoryFilter(value === 'all' ? '' : value)}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder={t('filter_by_subcategory_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">{t('all_subcategories')}</SelectItem>
                            {subCategories.map(sc => <SelectItem key={sc} value={sc}>{sc}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                {/* Table Section */}
                <div className="relative rounded-md border overflow-auto flex-1">
                {isAppDataLoading ? (
                <div className="absolute inset-0 flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
                ) : filteredProducts.length > 0 ? (
                <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                        <TableHead>{t('name_header')}</TableHead>
                        <TableHead className="hidden md:table-cell">{t('category_header')}</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">{t('selling_price_header')}</TableHead>
                        <TableHead className="text-right">{t('stock_header')}</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                        <TableCell className="font-medium">
                            {product.name}
                            <div className="text-xs text-muted-foreground md:hidden">{product.category} / {product.subCategory}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{product.category} / {product.subCategory}</TableCell>
                        <TableCell className="text-right font-semibold hidden sm:table-cell">
                            ৳ {product.sellingPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${product.stock === 0 ? 'text-destructive' : ''}`}>
                            {product.stock} <span className="text-xs text-muted-foreground">{product.mainCategory === 'Material' ? 'kg' : 'pcs'}</span>
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{t('open_menu_sr')}</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(product)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                {t('edit_product_button')}
                                </DropdownMenuItem>
                                {user?.role === 'admin' && <DropdownMenuSeparator />}
                                {user?.role === 'admin' && <DropdownMenuItem onClick={() => handleDeleteClick(product)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('delete_product_button')}
                                </DropdownMenuItem>}
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                ) : (
                <div className="flex justify-center items-center text-center h-full">
                    <div>
                    <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">{t('no_products_found_title')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('no_products_found_description')}
                    </p>
                     <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('add_product_button')}
                    </Button>
                    </div>
                </div>
                )}
                </div>
            </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      
      <AddProductDialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} />
      {editProduct && (
        <EditProductDialog
            key={editProduct.id}
            open={!!editProduct}
            onOpenChange={(open) => {
                if (!open) {
                    setEditProduct(null);
                }
            }}
            product={editProduct}
        />
      )}
       <AlertDialog open={showAdminAlert} onOpenChange={setShowAdminAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="text-destructive"/> {t('access_denied_title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin_permission_required_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowAdminAlert(false)}>
              {t('ok_button')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
       <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('are_you_sure_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_product_confirmation_description', { name: productToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>{t('cancel_button')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                {t('delete_button')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    