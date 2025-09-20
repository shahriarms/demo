
'use server';

import type { Product } from '@/lib/types';
import PostgresProductService from '@/services/product-service.postgres';

// This is a Server Action file.
// The logic within this file will only ever run on the server.
// It will only use PostgreSQL if the environment variable is set.

const usePostgres = !!process.env.POSTGRES_URL;

export async function checkDbConnection(): Promise<boolean> {
    if (!usePostgres) return false;
    try {
        // A lightweight query to check connection
        await PostgresProductService.checkConnection();
        return true;
    } catch (error) {
        console.error("Database connection check failed:", error);
        return false;
    }
}


export async function getAllProducts(): Promise<Product[]> {
    if (!usePostgres) {
        return [];
    }
    try {
        return await PostgresProductService.getAllProducts();
    } catch (error) {
        console.error("Failed to get all products:", error);
        throw new Error("Could not fetch products from the database.");
    }
}

export async function getProductById(productId: string): Promise<Product | undefined> {
    if (!usePostgres) return undefined;
    return PostgresProductService.getProductById(productId);
}

export async function addProduct(productData: Omit<Product, 'id' | 'sellingPrice'>): Promise<Product> {
    if (!usePostgres) throw new Error("Database not connected.");
    const sellingPrice = productData.buyingPrice + (productData.buyingPrice * productData.profitMargin / 100);
    return PostgresProductService.addProduct({...productData, sellingPrice});
}

export async function addMultipleProducts(productsData: Omit<Product, 'id' | 'sellingPrice'>[]): Promise<Product[]> {
    if (!usePostgres) throw new Error("Database not connected.");
     const productsWithSellingPrice = productsData.map(p => ({
        ...p,
        sellingPrice: p.buyingPrice + (p.buyingPrice * p.profitMargin / 100),
    }));
    return PostgresProductService.addMultipleProducts(productsWithSellingPrice);
}

export async function updateProduct(productId: string, updatedData: Omit<Product, 'id' | 'sellingPrice'>): Promise<Product | null> {
    if (!usePostgres) throw new Error("Database not connected.");
    const sellingPrice = updatedData.buyingPrice + (updatedData.buyingPrice * updatedData.profitMargin / 100);
    return PostgresProductService.updateProduct(productId, {...updatedData, sellingPrice});
}

export async function updateMultipleStocks(updates: { id: string, stockChange: number }[]): Promise<void> {
    if (!usePostgres) throw new Error("Database not connected.");
    return PostgresProductService.updateMultipleStocks(updates);
}

export async function deleteProduct(productId: string): Promise<{ deletedProductName: string | null }> {
    if (!usePostgres) throw new Error("Database not connected.");
    const deletedName = await PostgresProductService.deleteProduct(productId);
    return { deletedProductName: deletedName };
}
