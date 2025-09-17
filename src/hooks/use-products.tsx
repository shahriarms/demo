
'use client';
import { createContext, useContext, useMemo, useCallback } from 'react';
import type { Product } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useAppData } from './use-app-data';

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

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    // This might seem odd, but it allows us to create the context dynamically
    // based on the central app data. This is a bit of a pattern inversion.
    return useProductsData();
  }
  return context;
}


// This is the new core logic for product management.
// It relies on the central DataProvider.
const useProductsData = (): ProductContextType => {
  const { products, setProducts, isAppDataLoading } = useAppData();
  const { toast } = useToast();

  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'sellingPrice'>) => {
    const sellingPrice = productData.buyingPrice + (productData.buyingPrice * productData.profitMargin / 100);
    const productWithPrice = { ...productData, sellingPrice };

    const newProduct: Product = { ...productWithPrice, id: `prod-${Date.now()}` };
    setProducts(prev => [newProduct, ...prev]);
    toast({
        title: "Product Added",
        description: `${newProduct.name} has been added to your local inventory.`,
    });
  }, [toast, setProducts]);
  
  const addMultipleProducts = useCallback(async (productsData: Omit<Product, 'id'| 'sellingPrice'>[]) => {
    const productsWithSellingPrice = productsData.map(p => ({
      ...p,
      sellingPrice: p.buyingPrice + (p.buyingPrice * p.profitMargin / 100)
    }));

    const newLocalProducts: Product[] = productsWithSellingPrice.map(p => ({
        ...p,
        id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    }));
    setProducts(prev => [...prev, ...newLocalProducts]);
    toast({
        title: "Upload Successful",
        description: `${newLocalProducts.length} products have been added.`,
    });
  }, [toast, setProducts]);

  const updateProduct = useCallback(async (productId: string, updatedData: Omit<Product, 'id' | 'sellingPrice'>) => {
    const sellingPrice = updatedData.buyingPrice + (updatedData.buyingPrice * updatedData.profitMargin / 100);
    const productWithPrice = { ...updatedData, sellingPrice };
    
    const updatedProduct: Product = { ...productWithPrice, id: productId };
    setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
    toast({
        title: "Product Updated",
        description: `Details for ${updatedProduct.name} have been updated.`,
    });
  }, [toast, setProducts]);
    
  const deleteProduct = useCallback(async (productId: string) => {
    const productToDelete = products.find(p => p.id === productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (productToDelete) {
         toast({
            title: "Product Deleted",
            description: `${productToDelete.name} has been removed.`,
        });
    }
  }, [toast, products, setProducts]);

  const getProductById = useCallback((productId: string) => {
    return products.find(p => p.id === productId);
  }, [products]);
  
  return useMemo(() => ({ 
    products, 
    addProduct, 
    addMultipleProducts, 
    updateProduct, 
    deleteProduct, 
    getProductById, 
    isLoading: isAppDataLoading 
  }), [products, addProduct, addMultipleProducts, updateProduct, deleteProduct, getProductById, isAppDataLoading]);
}

    