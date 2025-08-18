
'use client';
import { useState, useEffect, createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import type { Product } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { getAllProducts, addProduct as addProductAction, updateProduct as updateProductAction, deleteProduct as deleteProductAction, addMultipleProducts as addMultipleProductsAction } from '@/lib/actions/product-actions';

const PRODUCTS_STORAGE_KEY = 'stockpilot-products';

// This initial data is now only a fallback for non-DB mode and for demonstration.
// It includes the new pricing fields.
const initialProducts: Product[] = [
    { id: 'prod-1', name: 'Angel 1" 4mm', sku: 'ANG-1-4', buyingPrice: 8.4, profitMargin: 25, sellingPrice: 10.5, stock: 597, mainCategory: 'Material', category: 'Angel', subCategory: '28' },
    { id: 'prod-2', name: 'Angel 1" 5mm', sku: 'ANG-1-5', buyingPrice: 10.2, profitMargin: 25, sellingPrice: 12.75, stock: 847, mainCategory: 'Material', category: 'Angel', subCategory: '28' },
    { id: 'prod-15', name: 'Hammer 500g', sku: 'HMR-500', buyingPrice: 12, profitMargin: 25, sellingPrice: 15, stock: 50, mainCategory: 'Hardware', category: 'Tools', subCategory: 'Hand Tools' },
    { id: 'prod-16', name: 'Screwdriver Set', sku: 'SCR-SET-10', buyingPrice: 18, profitMargin: 25, sellingPrice: 22.5, stock: 75, mainCategory: 'Hardware', category: 'Tools', subCategory: 'Hand Tools' },
];

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'sellingPrice'>) => Promise<void>;
  addMultipleProducts: (products: Omit<Product, 'id'|'sellingPrice'>[]) => Promise<void>;
  updateProduct: (productId: string, updatedData: Omit<Product, 'id' | 'sellingPrice'>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  isLoading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingDB, setIsUsingDB] = useState(false);
  const { toast } = useToast();

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
        const allProducts = await getAllProducts();
        if (allProducts && allProducts.length > 0) {
            setProducts(allProducts);
            setIsUsingDB(true);
        } else {
            const savedProductsJSON = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            let savedProducts = savedProductsJSON ? JSON.parse(savedProductsJSON) : null;
            
            if (savedProducts) {
                // Data migration for older versions that might not have sellingPrice
                const migratedProducts = savedProducts.map((p: any) => {
                    if (typeof p.sellingPrice !== 'number') {
                        const buyingPrice = p.buyingPrice || 0;
                        const profitMargin = p.profitMargin || 0;
                        p.sellingPrice = buyingPrice + (buyingPrice * profitMargin / 100);
                    }
                    return p;
                });
                setProducts(migratedProducts);
            } else {
                setProducts(initialProducts);
                localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(initialProducts));
            }
            setIsUsingDB(false);
        }
    } catch (error) {
        console.error("Failed to load products from server, falling back to localStorage", error);
        const savedProductsJSON = localStorage.getItem(PRODUCTS_STORAGE_KEY);
        let savedProducts = savedProductsJSON ? JSON.parse(savedProductsJSON) : null;
        if (savedProducts) setProducts(savedProducts);
        else {
            setProducts(initialProducts);
            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(initialProducts));
        }
        setIsUsingDB(false);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
      if (!isUsingDB && !isLoading) {
          localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      }
  }, [products, isLoading, isUsingDB]);


  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'sellingPrice'>) => {
    const sellingPrice = productData.buyingPrice + (productData.buyingPrice * productData.profitMargin / 100);
    const productWithPrice = { ...productData, sellingPrice };

    if (isUsingDB) {
        try {
            const newProduct = await addProductAction(productWithPrice);
            setProducts(prev => [newProduct, ...prev]);
            toast({
                title: "Product Added",
                description: `${newProduct.name} has been added to your inventory.`,
            });
        } catch(error) {
            console.error("Failed to add product", error);
            toast({ variant: "destructive", title: "Error", description: "Could not add product. Check DB connection." });
        }
    } else {
        // LocalStorage mode
        const newProduct: Product = { ...productWithPrice, id: `prod-${Date.now()}` };
        setProducts(prev => [newProduct, ...prev]);
        toast({
            title: "Product Added (Local)",
            description: `${newProduct.name} has been added to your local inventory.`,
        });
    }
  }, [toast, isUsingDB]);
  
  const addMultipleProducts = useCallback(async (productsData: Omit<Product, 'id'| 'sellingPrice'>[]) => {
    const productsWithSellingPrice = productsData.map(p => ({
      ...p,
      sellingPrice: p.buyingPrice + (p.buyingPrice * p.profitMargin / 100)
    }))

    if (isUsingDB) {
        try {
            const newProducts = await addMultipleProductsAction(productsWithSellingPrice);
            setProducts(prev => [...prev, ...newProducts]);
            toast({
                title: "Upload Successful",
                description: `${newProducts.length} products have been added.`,
            });
        } catch(error) {
            console.error("Failed to add multiple products", error);
            toast({ variant: "destructive", title: "Error", description: "Could not add products from file. Check DB connection." });
        }
    } else {
        const newLocalProducts: Product[] = productsWithSellingPrice.map(p => ({
            ...p,
            id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }));
        setProducts(prev => [...prev, ...newLocalProducts]);
        toast({
            title: "Upload Successful (Local)",
            description: `${newLocalProducts.length} products have been added locally.`,
        });
    }
  }, [toast, isUsingDB]);

  const updateProduct = useCallback(async (productId: string, updatedData: Omit<Product, 'id' | 'sellingPrice'>) => {
    const sellingPrice = updatedData.buyingPrice + (updatedData.buyingPrice * updatedData.profitMargin / 100);
    const productWithPrice = { ...updatedData, sellingPrice };

    if (isUsingDB) {
        try {
            const updatedProduct = await updateProductAction(productId, productWithPrice);
            if (updatedProduct) {
                 setProducts(prev =>
                    prev.map(p => (p.id === productId ? updatedProduct : p))
                );
                toast({
                    title: "Product Updated",
                    description: `Details for ${updatedProduct.name} have been updated.`,
                });
            }
        } catch(error) {
            console.error("Failed to update product", error);
            toast({ variant: "destructive", title: "Error", description: "Could not update product. Check DB connection." });
        }
    } else {
        // LocalStorage mode
        const updatedProduct: Product = { ...productWithPrice, id: productId };
        setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
        toast({
            title: "Product Updated (Local)",
            description: `Details for ${updatedProduct.name} have been updated locally.`,
        });
    }
  }, [toast, isUsingDB]);
    
  const deleteProduct = useCallback(async (productId: string) => {
    if (isUsingDB) {
        try {
            const deletedProductName = await deleteProductAction(productId);
            if(deletedProductName) {
                setProducts(prev => prev.filter(p => p.id !== productId));
                toast({
                    title: "Product Deleted",
                    description: `${deletedProductName} has been removed.`,
                });
            }
        } catch(error) {
            console.error("Failed to delete product", error);
            toast({ variant: "destructive", title: "Error", description: "Could not delete product. Check DB connection." });
        }
    } else {
        // LocalStorage mode
        const productToDelete = products.find(p => p.id === productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
        if (productToDelete) {
             toast({
                title: "Product Deleted (Local)",
                description: `${productToDelete.name} has been removed locally.`,
            });
        }
    }
  }, [toast, isUsingDB, products]);

  const getProductById = useCallback((productId: string) => {
    return products.find(p => p.id === productId);
  }, [products]);
  
  const value = useMemo(() => ({ products, addProduct, addMultipleProducts, updateProduct, deleteProduct, getProductById, isLoading }), [products, addProduct, addMultipleProducts, updateProduct, deleteProduct, getProductById, isLoading]);

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
