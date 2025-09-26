// src/app/pages/product-list/product-list.component.ts
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- 1. GARANTA QUE ESTA LINHA ESTEJA AQUI
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProductDialogComponent } from '../../../components/product-dialog/product-dialog.component';
import { Product } from '../../../models/Product';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';

// Dados mockados (simulando um banco de dados)
const ELEMENT_DATA: Product[] = [
  {
    id: 1,
    name: 'Teclado Mecânico RGB',
    sku: 'TEC-001',
    quantity: 50,
    price: 350.5,
    lastUpdated: new Date(),
  },
  {
    id: 2,
    name: 'Mouse Gamer 16000 DPI',
    sku: 'MOU-007',
    quantity: 75,
    price: 199.99,
    lastUpdated: new Date(),
  },
  {
    id: 3,
    name: 'Monitor Ultrawide 29"',
    sku: 'MON-029',
    quantity: 20,
    price: 1450.0,
    lastUpdated: new Date(),
  },
];

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, // <-- 2. A ADIÇÃO DESTE MÓDULO RESOLVE O PROBLEMA
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
    MatCardModule,
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements AfterViewInit {
  displayedColumns: string[] = ['id', 'name', 'sku', 'quantity', 'price', 'lastUpdated', 'actions'];
  dataSource = new MatTableDataSource<Product>(ELEMENT_DATA);
  @ViewChild(MatSort) sort!: MatSort;
  constructor(public dialog: MatDialog) {}

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }
  openProductDialog(product?: Product): void {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '450px',
      data: product ? { ...product } : null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const data = this.dataSource.data;
        if (result.id) {
          const index = data.findIndex((p) => p.id === result.id);
          if (index > -1) {
            data[index] = { ...result, lastUpdated: new Date() };
            this.dataSource.data = [...data];
          }
        } else {
          const newProduct: Product = {
            ...result,
            id: new Date().getTime(),
            lastUpdated: new Date(),
          };
          const newData = [...data, newProduct];
          this.dataSource.data = newData;
        }
      }
    });
  }

  deleteProduct(id: number): void {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      const filteredData = this.dataSource.data.filter((p) => p.id !== id);
      this.dataSource.data = filteredData;
    }
  }

  exportToCsv(): void {
    // ... (nenhuma mudança nesta função)
    const data = this.dataSource.data;
    if (data.length === 0) return;

    const header = Object.keys(data[0]).join(',');
    const csvRows = data.map((row) => {
      const values = Object.values(row).map((value) => {
        if (value instanceof Date) return `"${value.toLocaleString('pt-BR')}"`;
        const stringValue = String(value);
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
      });
      return values.join(',');
    });

    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'produtos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
