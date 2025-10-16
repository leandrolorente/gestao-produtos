# Gestão de Produtos - AI Coding Agent Instructions

## Project Overview
This is an Angular 20+ inventory management system using **standalone components** and **zoneless change detection**. The app manages inventory with full CRUD operations across multiple modules (Products, Sales, Clients, etc.), built with Angular Material and comprehensive service layer architecture.

## Architecture Patterns

### Component Structure
- **Standalone Components**: All components use `standalone: true` with explicit imports
- **Signal-based State**: Uses Angular signals (`signal()`) for reactive state management
- **Service Layer**: Full service architecture with API integration, authentication, and error handling
- **Layout System**: Main layout with header/sidebar navigation pattern

### Key Files & Patterns
- `src/app/layouts/main-layout/`: Layout component with header/sidebar structure
- `src/app/models/`: TypeScript interfaces for all entities (Product, Venda, Cliente, etc.)
- `src/app/services/`: Comprehensive service layer with auth, API communication
- `src/app/pages/`: Feature modules following consistent patterns (products, vendas, clients)
- `src/app/components/`: Reusable components (dialogs, forms, shared UI)

### Angular Material Integration
Always import required Material modules in component imports array:
```typescript
@Component({
  standalone: true,
  imports: [
    CommonModule, // Required for *ngIf, *ngFor
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    ReactiveFormsModule,
    // ... other Material modules
  ]
})
```

## Development Workflows

### Running the Application
- **Start dev server**: `npm start` (runs `ng serve`)
- **Build**: `npm run build`
- **Tests**: `npm test`
- **SSR serve**: `npm run serve:ssr:gestao-produtos`

### Code Generation
Use Angular CLI for consistency:
```bash
ng generate component components/component-name
ng generate component pages/feature-name/component-name
ng generate service services/service-name
```

## Critical Layout & UI Patterns

### Container Card Pattern
Every page follows the consistent container pattern:
```html
<mat-card class="container-card">
  <mat-card-content>
    <h2 class="page-title">Module Title</h2>
    <!-- Content -->
  </mat-card-content>
</mat-card>
```

### Statistics Dashboard Section
For modules with metrics, use the stats section pattern:
```html
<div class="stats-section">
  <mat-card class="stat-card">
    <mat-card-content>
      <div class="stat-content">
        <mat-icon class="stat-icon">icon_name</mat-icon>
        <div class="stat-info">
          <div class="stat-value">{{ value }}</div>
          <div class="stat-label">Label</div>
        </div>
      </div>
    </mat-card-content>
  </mat-card>
</div>
```

### Actions Header Pattern
Standard header with import/export and add buttons:
```html
<div class="actions-header">
  <div class="import-export-buttons">
    <button mat-raised-button color="accent" (click)="exportToCsv()">
      <mat-icon>cloud_download</mat-icon>
      Exportar CSV
    </button>
    <button mat-button (click)="clearFilters()">
      <mat-icon>clear_all</mat-icon>
      Limpar Filtros
    </button>
  </div>
  <button mat-fab extended color="primary" (click)="openCreateDialog()">
    <mat-icon>add</mat-icon>
    New Item
  </button>
</div>
```

### Search and Filters Pattern
Consistent search and filter layout:
```html
<!-- Search field -->
<mat-form-field appearance="outline" class="search-field">
  <mat-label>Buscar...</mat-label>
  <input matInput [formControl]="searchControl" placeholder="Digite...">
  <mat-icon matSuffix>search</mat-icon>
</mat-form-field>

<!-- Filters row -->
<div class="filters-row">
  <mat-form-field appearance="outline" class="filter-field">
    <mat-label>Filter 1</mat-label>
    <mat-select [formControl]="filter1Control">
      <!-- options -->
    </mat-select>
  </mat-form-field>
</div>
```

### Table Structure Pattern
Modern table with consistent styling:
```html
<div class="desktop-view" *ngIf="!loading()">
  <div class="mat-elevation-z8 table-container">
    <table mat-table [dataSource]="dataSource" matSort class="modern-table">
      <!-- Column definitions -->
      <tr mat-header-row *matHeaderRowDef="displayedColumns" class="header-row"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
          class="data-row" (dblclick)="onRowDoubleClick($event, row)"></tr>
    </table>
  </div>
</div>
```

### Actions Column Pattern
Standard actions column with menu:
```html
<ng-container matColumnDef="acoes">
  <th mat-header-cell *matHeaderCellDef class="actions-column">Ações</th>
  <td mat-cell *matCellDef="let item" class="actions-column non-clickable">
    <div class="action-buttons">
      <button mat-icon-button color="primary" (click)="edit(item); $event.stopPropagation()">
        <mat-icon>edit</mat-icon>
      </button>
      <button mat-icon-button [matMenuTriggerFor]="menu" (click)="$event.stopPropagation()">
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #menu="matMenu">
        <!-- Menu items -->
      </mat-menu>
    </div>
  </td>
</ng-container>
```

### Status Chips Pattern
Consistent status display:
```html
<mat-chip [class]="'status-' + item.status.toLowerCase()">
  {{ item.status }}
</mat-chip>
```

### Loading State Pattern
Consistent loading display:
```html
@if (loading()) {
  <div class="loading-container">
    <mat-progress-spinner mode="indeterminate" diameter="60"></mat-progress-spinner>
    <p>Carregando...</p>
  </div>
}
```

### No Data Message Pattern
Standard empty state:
```html
<div class="no-data-message" *ngIf="dataSource.data.length === 0">
  <mat-icon>icon_name</mat-icon>
  <h3>Nenhum item encontrado</h3>
  <p>Não há itens para exibir.</p>
  <button mat-raised-button color="primary" (click)="clearFilters()">
    <mat-icon>refresh</mat-icon>
    Limpar Filtros
  </button>
</div>
```

## State Management Patterns

### Signal-based Component State
Always use Angular signals for reactive state:
```typescript
export class FeatureComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  
  // Signals for data and loading states
  items = signal<Item[]>([]);
  loading = signal<boolean>(false);
  stats = signal<Stats | null>(null);
  
  // DataSource for table
  dataSource = new MatTableDataSource<Item>([]);
  
  // Form controls for filters
  searchControl = new FormControl('');
  statusFilter = new FormControl('');
  
  // Computed values for dashboard
  todayCount = computed(() => {
    const today = new Date().toDateString();
    return this.items().filter(item => 
      new Date(item.date).toDateString() === today
    ).length;
  });
}
```

### Service Integration Pattern
Consistent service calls with error handling:
```typescript
private loadItems(): void {
  this.loading.set(true);
  
  this.itemService.getAllItems().subscribe({
    next: (items) => {
      this.items.set(items);
      this.dataSource.data = items;
      this.loading.set(false);
    },
    error: (error) => {
      console.error('Erro ao carregar items:', error);
      this.authService.showSnackbar('Erro ao carregar items', 'error');
      this.loading.set(false);
    }
  });
}
```

### Filter Implementation Pattern
Standard filter setup with debouncing:
```typescript
private setupFilters(): void {
  // Search filter with debouncing
  this.searchControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged()
  ).subscribe(searchTerm => {
    this.applyFilters();
  });
  
  // Other filters
  this.statusFilter.valueChanges.subscribe(() => this.applyFilters());
}

private applyFilters(): void {
  let filteredData = [...this.items()];
  
  // Apply search filter
  const searchTerm = this.searchControl.value?.toLowerCase();
  if (searchTerm) {
    filteredData = filteredData.filter(item =>
      item.name.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply status filter
  const statusSelected = this.statusFilter.value;
  if (statusSelected && statusSelected !== 'Todos') {
    filteredData = filteredData.filter(item => item.status === statusSelected);
  }
  
  this.dataSource.data = filteredData;
}
```

### Double-click Row Interaction Pattern
Consistent table row interaction:
```typescript
/**
 * Handle double-click on table row (excluding actions column)
 */
onRowDoubleClick(event: Event, item: Item): void {
  const target = event.target as HTMLElement;
  
  // Ignore clicks on actions column
  if (target.closest('.actions-column') || 
      target.closest('button') || 
      target.closest('.non-clickable')) {
    return;
  }
  
  // Only allow edit if item can be edited
  if (this.canEdit(item)) {
    this.openEditDialog(item);
  }
}
```

### CRUD Operations Pattern
Standard CRUD with state updates:
```typescript
private createItem(itemData: ItemCreate): void {
  this.itemService.createItem(itemData).subscribe({
    next: (newItem) => {
      const currentItems = this.items();
      this.items.set([...currentItems, newItem]);
      this.dataSource.data = this.items();
      this.authService.showSnackbar('Item criado com sucesso!', 'success');
      this.loadStats(); // Refresh stats if applicable
    },
    error: (error) => {
      console.error('Erro ao criar item:', error);
      this.authService.showSnackbar('Erro ao criar item', 'error');
    }
  });
}

private updateItem(updatedItem: Item): void {
  this.itemService.updateItem(updatedItem).subscribe({
    next: (item) => {
      const items = this.items();
      const index = items.findIndex(i => i.id === item.id);
      if (index !== -1) {
        const newItems = [...items];
        newItems[index] = item;
        this.items.set(newItems);
        this.dataSource.data = newItems;
        this.authService.showSnackbar('Item atualizado com sucesso!', 'success');
      }
    },
    error: (error) => {
      console.error('Erro ao atualizar item:', error);
      this.authService.showSnackbar('Erro ao atualizar item', 'error');
    }
  });
}
```

### Permission Checking Pattern
Consistent permission checks:
```typescript
isAdmin(): boolean {
  const currentUser = this.authService.currentUser();
  return currentUser?.role === 'admin';
}

canEdit(item: Item): boolean {
  return this.itemService.canEdit(item);
}

canDelete(item: Item): boolean {
  return this.itemService.canDelete(item) && this.isAdmin();
}
```

## Project-Specific Conventions

### Language & Localization
- **Portuguese-Brazilian**: All UI text, error messages, and field labels are in pt-BR
- **Date formatting**: Uses `toLocaleString('pt-BR')` for date display
- **Currency formatting**: Uses `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- **Validation messages**: Custom Portuguese error messages in `getFieldErrorMessage()`

### Form Patterns
- **Reactive Forms**: All forms use FormBuilder with Validators
- **Number formatting**: Custom formatters for price (`formatPrice()`) and quantity (`formatQuantity()`)
- **Validation**: Real-time validation with Portuguese error messages
- **Form dialogs**: Standard dialog width of '900px' with maxHeight '90vh'

### Data Management
- **Service Layer**: Full service integration with API calls and error handling
- **State Updates**: Manual array manipulation with spread operators for immutability
- **ID Generation**: Server-generated IDs, local generation uses `new Date().getTime()` for mock data
- **Statistics**: Separate stats loading and computed properties for dashboard metrics

### Styling Approach
- **SCSS**: All components use SCSS with Angular Material theming
- **CSS Variables**: System uses custom CSS variables defined in `styles.scss`:
  - `--primary-gradient`: Main gradient colors
  - `--primary-color`: Primary brand color (#667eea)
  - `--background-gradient`: Card backgrounds
  - `--hover-purple`: Hover states
  - `--shadow-purple`: Box shadows
- **Responsive**: Mobile-first approach with proper breakpoints
- **Status Colors**: Consistent color coding for status chips and actions

### Action Button Patterns
For workflow actions (like sales status changes):
```typescript
confirmarItem(item: Item): void {
  this.confirmationService.confirmAction(
    'Confirmar Item',
    `Deseja confirmar o item ${item.numero}?`,
    'Confirmar',
    {
      icon: 'check_circle',
      iconColor: 'primary',
      actionColor: 'primary'
    }
  ).subscribe(confirmed => {
    if (!confirmed) return;
    
    this.itemService.confirmarItem(item.id).subscribe({
      next: (updatedItem) => {
        // Update state
        this.updateItemInList(updatedItem);
        this.authService.showSnackbar(`Item ${item.numero} confirmado!`, 'success');
        this.loadStats();
      },
      error: (error) => {
        console.error('Erro ao confirmar item:', error);
        this.authService.showSnackbar('Erro ao confirmar item', 'error');
      }
    });
  });
}
```

### Menu Action Colors
Consistent color coding for menu actions:
```scss
.confirm-action { color: #2e7d32 !important; }
.finalize-action { color: #1976d2 !important; }
.process-action { color: #ff6f00 !important; }
.cancel-action { color: #d32f2f !important; }
.delete-action { color: #f44336 !important; }
```

### Print Functionality Pattern
For documents that need printing:
```typescript
printItem(item: Item): void {
  const printContent = this.generatePrintContent(item);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  } else {
    this.authService.showSnackbar('Não foi possível abrir a janela de impressão', 'error');
  }
}

private generatePrintContent(item: Item): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Item ${item.numero}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        /* More print styles */
      </style>
    </head>
    <body>
      <!-- Print content -->
    </body>
    </html>
  `;
}
```

## Critical Integration Points

### Dialog Communication
Product dialogs return form data via `MatDialogRef.close(result)`. Parent component handles:
- Edit mode: Updates existing item in array
- Create mode: Adds new item with generated ID  
- Both update `lastUpdated` timestamp

### CSV Export Feature
Custom CSV export in `exportToCsv()` method handles:
- Date formatting for Brazilian locale
- Comma escaping in CSV values
- Direct browser download via Blob API
- Semicolon separator for Brazilian Excel compatibility

### Routing Structure
- Default route redirects to `/produtos`
- Single-page app with component-based routing
- Auth guards implemented via `auth.guard.ts`
- Lazy loading patterns for feature modules

### Error Handling Patterns
Consistent error handling across services:
```typescript
this.service.action().subscribe({
  next: (result) => {
    // Success handling
    this.authService.showSnackbar('Ação realizada com sucesso!', 'success');
  },
  error: (error) => {
    console.error('Erro na ação:', error);
    const message = error.message || 'Erro inesperado';
    this.authService.showSnackbar(message, 'error');
  }
});
```

### Table Responsiveness Pattern
Comprehensive mobile responsiveness:
```scss
@media (max-width: 768px) {
  .modern-table {
    font-size: 0.8rem;
    
    // Hide less important columns
    .mat-column-formaPagamento {
      display: none;
    }
  }
  
  .mat-column-numero {
    min-width: 70px !important;
  }
}

@media (max-width: 480px) {
  .modern-table {
    // Hide more columns for very small screens
    .mat-column-dataVenda {
      display: none;
    }
  }
}
```

## When Adding Features
1. Create standalone components with explicit Material module imports
2. Use Portuguese labels and validation messages
3. Follow the established service integration patterns with proper error handling
4. Maintain the existing form validation and formatting patterns
5. Add proper TypeScript interfaces in `models/` directory
6. Implement responsive design following the mobile-first approach
7. Use the established patterns for:
   - Signal-based state management with computed properties
   - Filter implementation with debouncing
   - CRUD operations with optimistic updates
   - Permission checking and workflow actions
   - Print functionality for business documents
   - Statistics calculations and dashboard metrics

## Advanced Patterns from Sales Module

### Complex State Management
For modules with workflow states (like sales with Pendente → Confirmada → Finalizada):
```typescript
// Workflow action methods
confirmarVenda(venda: Venda): void {
  if (venda.status !== 'Pendente') {
    this.authService.showSnackbar('Apenas vendas pendentes podem ser confirmadas', 'error');
    return;
  }
  
  this.confirmationService.confirmAction(
    'Confirmar Venda',
    `Deseja confirmar a venda ${venda.numero}?`,
    'Confirmar',
    { icon: 'check_circle', iconColor: 'primary', actionColor: 'primary' }
  ).subscribe(confirmed => {
    if (!confirmed) return;
    
    this.vendaService.confirmarVenda(venda.id).subscribe({
      next: (vendaAtualizada) => {
        this.updateItemInList(vendaAtualizada);
        this.authService.showSnackbar(`Venda ${venda.numero} confirmada!`, 'success');
        this.loadStats();
      },
      error: (error) => {
        console.error('Erro ao confirmar venda:', error);
        this.authService.showSnackbar('Erro ao confirmar venda', 'error');
      }
    });
  });
}

// Permission checking methods
podeConfirmar(venda: Venda): boolean {
  return this.vendaService.podeConfirmar(venda);
}
```

### Complex Column Patterns
For displaying rich information in table columns:
```html
<!-- Multi-line column with primary and secondary info -->
<ng-container matColumnDef="cliente">
  <th mat-header-cell *matHeaderCellDef mat-sort-header>Cliente</th>
  <td mat-cell *matCellDef="let venda">
    <div class="cliente-info">
      <div class="nome-cliente">{{ venda.clienteNome }}</div>
      <div class="email-cliente">{{ venda.clienteEmail }}</div>
    </div>
  </td>
</ng-container>

<!-- Price column with discount display -->
<ng-container matColumnDef="total">
  <th mat-header-cell *matHeaderCellDef mat-sort-header class="total-column">Total</th>
  <td mat-cell *matCellDef="let venda" class="total-column">
    <div class="price-info">
      <div class="price-value">{{ formatPrice(venda.total) }}</div>
      <div class="price-details" *ngIf="venda.desconto > 0">
        <span class="original-price">{{ formatPrice(venda.subtotal) }}</span>
        <span class="discount">-{{ formatPrice(venda.desconto) }}</span>
      </div>
    </div>
  </td>
</ng-container>
```

### Advanced Filter Patterns
For modules requiring multiple filter types:
```typescript
// Multiple filter controls
statusFilter = new FormControl('');
formaPagamentoFilter = new FormControl('');
dateRangeFilter = new FormControl('');

// Filter options
statusOptions = ['Todos', 'Pendente', 'Confirmada', 'Finalizada', 'Cancelada'];
formasPagamento = ['Todas', 'Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito'];

private applyFilters(): void {
  let filteredData = [...this.items()];
  
  // Multiple filter application
  const searchTerm = this.searchControl.value?.toLowerCase();
  if (searchTerm) {
    filteredData = filteredData.filter(item =>
      item.numero.toLowerCase().includes(searchTerm) ||
      item.clienteNome.toLowerCase().includes(searchTerm)
    );
  }
  
  const statusSelected = this.statusFilter.value;
  if (statusSelected && statusSelected !== 'Todos') {
    filteredData = filteredData.filter(item => item.status === statusSelected);
  }
  
  this.dataSource.data = filteredData;
}
```

### Statistics Card Grid Pattern
For dashboard-style statistics sections:
```html
<div class="stats-section">
  <mat-card class="stat-card">
    <mat-card-content>
      <div class="stat-content">
        <mat-icon class="stat-icon">today</mat-icon>
        <div class="stat-info">
          <div class="stat-value">{{ todayCount() }}</div>
          <div class="stat-label">Hoje</div>
        </div>
      </div>
    </mat-card-content>
  </mat-card>
  
  <!-- More stat cards... -->
</div>
```

### Advanced Menu Actions Pattern
For complex workflow menus with conditional actions:
```html
<mat-menu #menuItem="matMenu">
  <button mat-menu-item (click)="openViewDialog(item)">
    <mat-icon>visibility</mat-icon>
    Ver Detalhes
  </button>
  
  <!-- Workflow actions section -->
  <mat-divider *ngIf="podeConfirmar(item) || podeFinalizar(item)"></mat-divider>
  
  <button mat-menu-item (click)="confirmarItem(item)" *ngIf="podeConfirmar(item)" class="confirm-action">
    <mat-icon>check_circle</mat-icon>
    Confirmar Item
  </button>
  
  <button mat-menu-item (click)="finalizarItem(item)" *ngIf="podeFinalizar(item)" class="finalize-action">
    <mat-icon>done_all</mat-icon>
    Finalizar Item
  </button>
  
  <button mat-menu-item (click)="processarCompleto(item)" *ngIf="podeConfirmar(item)" class="process-action">
    <mat-icon>flash_on</mat-icon>
    Processar Completo
  </button>
  
  <!-- Utilities section -->
  <mat-divider></mat-divider>
  <button mat-menu-item (click)="printItem(item)">
    <mat-icon>print</mat-icon>
    Imprimir
  </button>
  
  <!-- Admin actions -->
  <mat-divider *ngIf="isAdmin()"></mat-divider>
  <button mat-menu-item class="delete-action" (click)="deleteItem(item)" *ngIf="isAdmin()">
    <mat-icon>delete</mat-icon>
    Excluir
  </button>
</mat-menu>
```
