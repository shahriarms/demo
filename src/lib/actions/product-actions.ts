
'use server';

import type { Product } from '@/lib/types';
import PostgresProductService from '@/services/product-service.postgres';

// This is a Server Action file.
// The logic within this file will only ever run on the server.
// It will only use PostgreSQL if the environment variable is set.

const usePostgres = !!process.env.POSTGRES_URL;

export async function getAllProducts(): Promise<Product[]> {
    // This action can be called by the client to check for a DB connection.
    // If no DB, return empty array, and client will use localStorage.
    if (!usePostgres) return []; 
    return PostgresProductService.getAllProducts();
}

export async function getProductById(productId: string): Promise<Product | undefined> {
    if (!usePostgres) return undefined;
    return PostgresProductService.getProductById(productId);
}

export async function addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    // This action should only be called by the client if usePostgres is true.
    return PostgresProductService.addProduct(productData);
}

export async function addMultipleProducts(productsData: Omit<Product, 'id'>[]): Promise<Product[]> {
    return PostgresProductService.addMultipleProducts(productsData);
}

export async function updateProduct(productId: string, updatedData: Omit<Product, 'id'>): Promise<Product | null> {
    return PostgresProductService.updateProduct(productId, updatedData);
}

export async function deleteProduct(productId: string): Promise<string | null> {
    return PostgresProductService.deleteProduct(productId);
}
