import { Product } from './Product';

describe('Product Model', () => {
  it('should create a valid product object', () => {
    const product: Product = {
      id: 1,
      name: 'Produto Teste',
      sku: 'TEST-001',
      quantity: 10,
      price: 99.99,
      lastUpdated: new Date('2025-09-26')
    };

    expect(product.id).toBe(1);
    expect(product.name).toBe('Produto Teste');
    expect(product.sku).toBe('TEST-001');
    expect(product.quantity).toBe(10);
    expect(product.price).toBe(99.99);
    expect(product.lastUpdated).toEqual(new Date('2025-09-26'));
  });

  it('should allow all required properties', () => {
    const product: Product = {
      id: 123,
      name: 'Nome do Produto',
      sku: 'SKU-123',
      quantity: 50,
      price: 199.99,
      lastUpdated: new Date()
    };

    expect(typeof product.id).toBe('number');
    expect(typeof product.name).toBe('string');
    expect(typeof product.sku).toBe('string');
    expect(typeof product.quantity).toBe('number');
    expect(typeof product.price).toBe('number');
    expect(product.lastUpdated instanceof Date).toBeTruthy();
  });
});