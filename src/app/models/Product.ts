// src/app/product.model.ts
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string; // Código de barras opcional
  quantity: number;
  price: number;
  lastUpdated: Date;
}
