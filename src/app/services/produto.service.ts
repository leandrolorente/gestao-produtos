import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { Product } from '../models/Product';

export interface ProductCreateDto {
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface ProductUpdateDto extends Partial<ProductCreateDto> {
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProdutoService extends BaseApiService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public readonly loading$ = this.loadingSubject.asObservable();

  // Signal para armazenar os produtos localmente
  private readonly productsSignal = signal<Product[]>([]);
  public readonly products = this.productsSignal.asReadonly();

  /**
   * Busca todos os produtos
   */
  getAllProducts(): Observable<Product[]> {
    this.loadingSubject.next(true);

    return this.http.get<Product[]>(this.buildUrl('produtos'), this.httpOptions)
      .pipe(
        tap(products => {
          this.productsSignal.set(products);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          console.error('Erro ao buscar produtos:', error);
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Busca um produto por ID
   */
  getProductById(id: number): Observable<Product> {
    this.loadingSubject.next(true);

    return this.http.get<Product>(this.buildUrl(`produtos/${id}`), this.httpOptions)
      .pipe(
        tap(() => this.loadingSubject.next(false)),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Busca um produto por código de barras
   */
  getProductByBarcode(barcode: string): Observable<Product> {
    this.loadingSubject.next(true);

    return this.http.get<Product>(this.buildUrl(`produtos/barcode/${barcode}`), this.httpOptions)
      .pipe(
        tap(() => this.loadingSubject.next(false)),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Cria um novo produto
   */
  createProduct(product: ProductCreateDto): Observable<Product> {
    this.loadingSubject.next(true);

    return this.http.post<Product>(this.buildUrl('produtos'), product, this.httpOptions)
      .pipe(
        tap(newProduct => {
          // Atualiza a lista local
          const currentProducts = this.productsSignal();
          this.productsSignal.set([...currentProducts, newProduct]);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Atualiza um produto existente
   */
  updateProduct(product: ProductUpdateDto): Observable<Product> {
    this.loadingSubject.next(true);

    return this.http.put<Product>(this.buildUrl(`produtos/${product.id}`), product, this.httpOptions)
      .pipe(
        tap(updatedProduct => {
          // Atualiza a lista local
          const currentProducts = this.productsSignal();
          const index = currentProducts.findIndex(p => p.id === updatedProduct.id);
          if (index !== -1) {
            const updatedProducts = [...currentProducts];
            updatedProducts[index] = updatedProduct;
            this.productsSignal.set(updatedProducts);
          }
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Remove um produto
   */
  deleteProduct(id: number): Observable<void> {
    this.loadingSubject.next(true);

    return this.http.delete<void>(this.buildUrl(`produtos/${id}`), this.httpOptions)
      .pipe(
        tap(() => {
          // Remove da lista local
          const currentProducts = this.productsSignal();
          const filteredProducts = currentProducts.filter(p => p.id !== id);
          this.productsSignal.set(filteredProducts);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Busca produtos com filtros
   */
  searchProducts(filters?: { name?: string; sku?: string; lowStock?: boolean }): Observable<Product[]> {
    this.loadingSubject.next(true);
    const params = this.buildParams(filters);

    return this.http.get<Product[]>(this.buildUrl('produtos'), {
      ...this.httpOptions,
      params
    }).pipe(
      tap(products => {
        this.productsSignal.set(products);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }
}
