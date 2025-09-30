import { Component, OnInit, ViewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Venda, VendaCreate, VendasStats } from '../../../models/Venda';
import { VendaService } from '../../../services/venda.service';
import { VendaDialogComponent } from '../../../components/venda-dialog/venda-dialog.component';

@Component({
  selector: 'app-venda-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    ReactiveFormsModule
  ],
  templateUrl: './venda-list.component.html',
  styleUrls: ['./venda-list.component.scss']
})
export class VendaListComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;

  // Signals para estado
  vendas = signal<Venda[]>([]);
  loading = signal<boolean>(false);
  stats = signal<VendasStats | null>(null);

  // DataSource para a tabela
  dataSource = new MatTableDataSource<Venda>([]);

  // Colunas da tabela
  displayedColumns: string[] = [
    'numero',
    'cliente',
    'dataVenda',
    'status',
    'formaPagamento',
    'total',
    'acoes'
  ];

  // Filtros
  searchControl = new FormControl('');
  statusFilter = new FormControl('');
  formaPagamentoFilter = new FormControl('');

  // Opções para filtros
  statusOptions = ['Todos', 'Pendente', 'Confirmada', 'Finalizada', 'Cancelada'];
  formasPagamento = ['Todas', 'Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito', 'Boleto', 'Transferência'];

  // Computed para estatísticas resumidas
  vendasHoje = computed(() => {
    const hoje = new Date().toDateString();
    return this.vendas().filter(venda =>
      new Date(venda.dataVenda).toDateString() === hoje
    ).length;
  });

  faturamentoMes = computed(() => {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    return this.vendas()
      .filter(venda => {
        const dataVenda = new Date(venda.dataVenda);
        return dataVenda >= inicioMes && venda.status === 'Finalizada';
      })
      .reduce((total, venda) => total + venda.total, 0);
  });

  vendasPendentes = computed(() => {
    return this.vendas().filter(venda => venda.status === 'Pendente').length;
  });

  constructor(
    private vendaService: VendaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadVendas();
    this.loadStats();
    this.setupFilters();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  private loadVendas(): void {
    this.loading.set(true);

    this.vendaService.getAllVendas().subscribe({
      next: (vendas) => {
        this.vendas.set(vendas);
        this.dataSource.data = vendas;
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar vendas:', error);
        this.snackBar.open('Erro ao carregar vendas', 'Fechar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  private loadStats(): void {
    this.vendaService.getVendasStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (error) => {
        console.error('Erro ao carregar estatísticas:', error);
      }
    });
  }

  private setupFilters(): void {
    // Filtro de busca por texto
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.applyFilters();
    });

    // Filtros de status e forma de pagamento
    this.statusFilter.valueChanges.subscribe(() => this.applyFilters());
    this.formaPagamentoFilter.valueChanges.subscribe(() => this.applyFilters());
  }

  private applyFilters(): void {
    let filteredData = [...this.vendas()];

    // Filtro de busca
    const searchTerm = this.searchControl.value?.toLowerCase();
    if (searchTerm) {
      filteredData = filteredData.filter(venda =>
        venda.numero.toLowerCase().includes(searchTerm) ||
        venda.clienteNome.toLowerCase().includes(searchTerm) ||
        venda.clienteEmail.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro de status
    const statusSelected = this.statusFilter.value;
    if (statusSelected && statusSelected !== 'Todos') {
      filteredData = filteredData.filter(venda => venda.status === statusSelected);
    }

    // Filtro de forma de pagamento
    const formaPagamentoSelected = this.formaPagamentoFilter.value;
    if (formaPagamentoSelected && formaPagamentoSelected !== 'Todas') {
      filteredData = filteredData.filter(venda => venda.formaPagamento === formaPagamentoSelected);
    }

    this.dataSource.data = filteredData;
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(VendaDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { editMode: false },
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createVenda(result);
      }
    });
  }

  openEditDialog(venda: Venda): void {
    const dialogRef = this.dialog.open(VendaDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { venda, editMode: true },
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateVenda(result);
      }
    });
  }

  private createVenda(vendaData: VendaCreate): void {
    this.vendaService.createVenda(vendaData).subscribe({
      next: (novaVenda) => {
        const vendasAtuais = this.vendas();
        this.vendas.set([...vendasAtuais, novaVenda]);
        this.dataSource.data = this.vendas();
        this.snackBar.open('Venda criada com sucesso!', 'Fechar', { duration: 3000 });
        this.loadStats(); // Recarrega estatísticas
      },
      error: (error) => {
        console.error('Erro ao criar venda:', error);
        this.snackBar.open('Erro ao criar venda', 'Fechar', { duration: 3000 });
      }
    });
  }

  private updateVenda(vendaAtualizada: Venda): void {
    this.vendaService.updateVenda(vendaAtualizada).subscribe({
      next: (venda) => {
        const vendas = this.vendas();
        const index = vendas.findIndex(v => v.id === venda.id);
        if (index !== -1) {
          const novasVendas = [...vendas];
          novasVendas[index] = venda;
          this.vendas.set(novasVendas);
          this.dataSource.data = novasVendas;
          this.snackBar.open('Venda atualizada com sucesso!', 'Fechar', { duration: 3000 });
          this.loadStats(); // Recarrega estatísticas
        }
      },
      error: (error) => {
        console.error('Erro ao atualizar venda:', error);
        this.snackBar.open('Erro ao atualizar venda', 'Fechar', { duration: 3000 });
      }
    });
  }

  deleteVenda(venda: Venda): void {
    if (confirm(`Tem certeza que deseja excluir a venda ${venda.numero}?`)) {
      this.vendaService.deleteVenda(venda.id).subscribe({
        next: () => {
          const vendas = this.vendas();
          this.vendas.set(vendas.filter(v => v.id !== venda.id));
          this.dataSource.data = this.vendas();
          this.snackBar.open('Venda excluída com sucesso!', 'Fechar', { duration: 3000 });
          this.loadStats(); // Recarrega estatísticas
        },
        error: (error) => {
          console.error('Erro ao excluir venda:', error);
          this.snackBar.open('Erro ao excluir venda', 'Fechar', { duration: 3000 });
        }
      });
    }
  }

  exportToCsv(): void {
    const headers = ['Número', 'Cliente', 'Email', 'Data Venda', 'Status', 'Forma Pagamento', 'Subtotal', 'Desconto', 'Total'];
    const csvData = this.dataSource.data.map(venda => [
      venda.numero,
      venda.clienteNome,
      venda.clienteEmail,
      this.formatDate(venda.dataVenda),
      venda.status,
      venda.formaPagamento,
      venda.subtotal.toFixed(2).replace('.', ','),
      venda.desconto.toFixed(2).replace('.', ','),
      venda.total.toFixed(2).replace('.', ',')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(';'))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `vendas_${this.formatDate(new Date())}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusFilter.setValue('');
    this.formaPagamentoFilter.setValue('');
    this.dataSource.data = this.vendas();
  }

  getStatusChipColor(status: string): string {
    switch (status) {
      case 'Finalizada': return 'primary';
      case 'Confirmada': return 'accent';
      case 'Pendente': return 'warn';
      case 'Cancelada': return '';
      default: return '';
    }
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('pt-BR');
  }
}
