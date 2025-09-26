// src/app/product.model.ts
export interface Product {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  lastUpdated: Date;
}
