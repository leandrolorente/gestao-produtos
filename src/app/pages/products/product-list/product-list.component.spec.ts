import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';

import { ProductListComponent } from './product-list.component';
import { Product } from '../../../models/Product';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    
    await TestBed.configureTestingModule({
      imports: [
        ProductListComponent,
        MatDialogModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatSortModule,
        MatCardModule,
        BrowserAnimationsModule
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial data loaded', () => {
    expect(component.dataSource.data.length).toBeGreaterThan(0);
  });

  it('should display correct columns', () => {
    const expectedColumns = ['id', 'name', 'sku', 'quantity', 'price', 'lastUpdated', 'actions'];
    expect(component.displayedColumns).toEqual(expectedColumns);
  });

  it('should open dialog when adding new product', () => {
    const dialogRefMock = {
      afterClosed: () => of(null)
    };
    mockDialog.open.and.returnValue(dialogRefMock as any);

    component.openProductDialog();

    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should delete product when confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const initialCount = component.dataSource.data.length;
    const productId = component.dataSource.data[0].id;

    component.deleteProduct(productId);

    expect(component.dataSource.data.length).toBe(initialCount - 1);
    expect(component.dataSource.data.find(p => p.id === productId)).toBeUndefined();
  });

  it('should not delete product when not confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    const initialCount = component.dataSource.data.length;
    const productId = component.dataSource.data[0].id;

    component.deleteProduct(productId);

    expect(component.dataSource.data.length).toBe(initialCount);
  });

  it('should add new product when dialog returns data', () => {
    const newProduct = {
      name: 'Novo Produto',
      sku: 'NEW-001',
      quantity: 5,
      price: 49.99
    };

    const dialogRefMock = {
      afterClosed: () => of(newProduct)
    };
    mockDialog.open.and.returnValue(dialogRefMock as any);
    
    const initialCount = component.dataSource.data.length;
    component.openProductDialog();

    expect(component.dataSource.data.length).toBe(initialCount + 1);
    const addedProduct = component.dataSource.data[component.dataSource.data.length - 1];
    expect(addedProduct.name).toBe(newProduct.name);
    expect(addedProduct.sku).toBe(newProduct.sku);
    expect(addedProduct.id).toBeTruthy(); // ID deve ser gerado
  });

  it('should update existing product when dialog returns data with id', () => {
    const existingProduct = component.dataSource.data[0];
    const updatedData = {
      ...existingProduct,
      name: 'Nome Atualizado',
      price: 199.99
    };

    const dialogRefMock = {
      afterClosed: () => of(updatedData)
    };
    mockDialog.open.and.returnValue(dialogRefMock as any);
    
    component.openProductDialog(existingProduct);

    const updatedProduct = component.dataSource.data.find(p => p.id === existingProduct.id);
    expect(updatedProduct?.name).toBe('Nome Atualizado');
    expect(updatedProduct?.price).toBe(199.99);
    expect(updatedProduct?.lastUpdated).toBeTruthy();
  });

  it('should export CSV with correct format', () => {
    spyOn(document, 'createElement').and.callThrough();
    spyOn(document.body, 'appendChild').and.callThrough();
    spyOn(document.body, 'removeChild').and.callThrough();
    
    component.exportToCsv();

    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  it('should not export CSV when no data', () => {
    component.dataSource.data = [];
    spyOn(document, 'createElement');
    
    component.exportToCsv();

    expect(document.createElement).not.toHaveBeenCalled();
  });
});
