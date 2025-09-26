// src/app/pages/product-list/product-list.component.ts
import { AfterViewInit, Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- 1. GARANTA QUE ESTA LINHA ESTEJA AQUI
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProductDialogComponent } from '../../../components/product-dialog/product-dialog.component';
import { Product } from '../../../models/Product';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements AfterViewInit {
  displayedColumns: string[] = ['id', 'name', 'sku', 'quantity', 'price', 'lastUpdated', 'actions'];
  dataSource = new MatTableDataSource<Product>(ELEMENT_DATA);
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  constructor(public dialog: MatDialog) {}

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    // Configurar filtro customizado para buscar por nome ou SKU
    this.dataSource.filterPredicate = (data: Product, filter: string) => {
      const searchTerm = filter.toLowerCase();
      return data.name.toLowerCase().includes(searchTerm) || 
             data.sku.toLowerCase().includes(searchTerm);
    };
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
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

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        this.importCsv(file);
      } else {
        alert('Por favor, selecione um arquivo CSV válido.');
      }
    }
  }

  private importCsv(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const products = this.parseCsvToProducts(csv);
        
        if (products.length > 0) {
          this.addImportedProducts(products);
          alert(`${products.length} produto${products.length > 1 ? 's' : ''} importado${products.length > 1 ? 's' : ''} com sucesso!`);
        } else {
          alert('Nenhum produto válido encontrado no arquivo CSV.');
        }
      } catch (error) {
        console.error('Erro ao importar CSV:', error);
        alert('Erro ao processar o arquivo CSV. Verifique o formato e tente novamente.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  private parseCsvToProducts(csv: string): Product[] {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) return []; // Precisa ter pelo menos header + 1 linha

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const products: Product[] = [];

    // Validar se tem as colunas necessárias
    const requiredColumns = ['name', 'sku', 'quantity', 'price'];
    const hasRequiredColumns = requiredColumns.every(col => 
      headers.some(header => header.toLowerCase().includes(col.toLowerCase()))
    );

    if (!hasRequiredColumns) {
      throw new Error('O arquivo CSV deve conter as colunas: name, sku, quantity, price');
    }

    // Mapear índices das colunas
    const columnIndexes = {
      name: this.findColumnIndex(headers, ['name', 'nome', 'produto']),
      sku: this.findColumnIndex(headers, ['sku', 'código', 'codigo']),
      quantity: this.findColumnIndex(headers, ['quantity', 'quantidade', 'qtd', 'estoque']),
      price: this.findColumnIndex(headers, ['price', 'preço', 'preco', 'valor'])
    };

    // Processar cada linha de dados
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      
      if (values.length >= Math.max(...Object.values(columnIndexes)) + 1) {
        try {
          const product: Product = {
            id: new Date().getTime() + i, // ID único baseado em timestamp
            name: values[columnIndexes.name]?.trim() || '',
            sku: values[columnIndexes.sku]?.trim() || '',
            quantity: this.parseNumber(values[columnIndexes.quantity]) || 0,
            price: this.parseNumber(values[columnIndexes.price]) || 0,
            lastUpdated: new Date()
          };

          // Validar produto antes de adicionar
          if (this.isValidProduct(product)) {
            products.push(product);
          }
        } catch (error) {
          console.warn(`Erro ao processar linha ${i + 1}:`, error);
        }
      }
    }

    return products;
  }

  private findColumnIndex(headers: string[], possibleNames: string[]): number {
    for (const name of possibleNames) {
      const index = headers.findIndex(header => 
        header.toLowerCase().includes(name.toLowerCase())
      );
      if (index !== -1) return index;
    }
    return -1;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  }

  private parseNumber(value: string): number {
    if (!value) return 0;
    
    // Remove caracteres não numéricos exceto vírgula, ponto e sinal negativo
    const cleanValue = value.replace(/[^\d.,-]/g, '');
    
    // Converte vírgula para ponto (formato brasileiro)
    const normalizedValue = cleanValue.replace(',', '.');
    
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  private isValidProduct(product: Product): boolean {
    return !!(
      product.name && 
      product.name.length >= 3 &&
      product.sku && 
      product.sku.length >= 3 &&
      product.quantity >= 0 &&
      product.price > 0
    );
  }

  private addImportedProducts(newProducts: Product[]): void {
    const currentData = this.dataSource.data;
    const existingSkus = new Set(currentData.map(p => p.sku.toLowerCase()));
    
    // Filtrar produtos que não existem (baseado no SKU)
    const productsToAdd = newProducts.filter(product => 
      !existingSkus.has(product.sku.toLowerCase())
    );

    if (productsToAdd.length < newProducts.length) {
      const duplicateCount = newProducts.length - productsToAdd.length;
      alert(`${duplicateCount} produto${duplicateCount > 1 ? 's' : ''} ${duplicateCount > 1 ? 'foram ignorados' : 'foi ignorado'} por já ${duplicateCount > 1 ? 'existirem' : 'existir'} no estoque (SKU duplicado).`);
    }

    if (productsToAdd.length > 0) {
      // Adicionar novos produtos
      const updatedData = [...currentData, ...productsToAdd];
      this.dataSource.data = updatedData;
    }
  }
}
