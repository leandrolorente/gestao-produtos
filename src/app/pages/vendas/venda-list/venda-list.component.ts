import { Component, OnInit, ViewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
import { AuthService } from '../../../services/auth.service';
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
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadVendas();
    this.loadStats();
    this.setupFilters();
  }

  // Verifica se o usuário é admin
  isAdmin(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.role === 'admin';
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
        this.authService.showSnackbar('Erro ao carregar vendas', 'error');
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

  openViewDialog(venda: Venda): void {
    this.dialog.open(VendaDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { venda, editMode: false },
      panelClass: 'custom-dialog'
    });
  }

  printVenda(venda: Venda): void {
    // Implementação da impressão da venda
    const printContent = this.generatePrintContent(venda);
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

  private generatePrintContent(venda: Venda): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Venda ${venda.numero}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info { margin-bottom: 20px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f2f2f2; }
          .total { text-align: right; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sistema de Gestão - Venda ${venda.numero}</h1>
        </div>
        
        <div class="info">
          <p><strong>Cliente:</strong> ${venda.clienteNome}</p>
          <p><strong>Email:</strong> ${venda.clienteEmail}</p>
          <p><strong>Data:</strong> ${this.formatDate(venda.dataVenda)}</p>
          <p><strong>Status:</strong> ${venda.status}</p>
          <p><strong>Forma de Pagamento:</strong> ${venda.formaPagamento}</p>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Quantidade</th>
              <th>Preço Unitário</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${venda.items.map((item: any) => `
              <tr>
                <td>${item.produtoNome}</td>
                <td>${item.quantidade}</td>
                <td>R$ ${item.precoUnitario.toFixed(2)}</td>
                <td>R$ ${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">
          <p>Subtotal: R$ ${venda.subtotal.toFixed(2)}</p>
          <p>Desconto: R$ ${venda.desconto.toFixed(2)}</p>
          <p><strong>Total: R$ ${venda.total.toFixed(2)}</strong></p>
        </div>
      </body>
      </html>
    `;
  }

  private createVenda(vendaData: VendaCreate): void {
    this.vendaService.createVenda(vendaData).subscribe({
      next: (novaVenda) => {
        const vendasAtuais = this.vendas();
        this.vendas.set([...vendasAtuais, novaVenda]);
        this.dataSource.data = this.vendas();
        this.authService.showSnackbar('Venda criada com sucesso!', 'success');
        this.loadStats(); // Recarrega estatísticas
      },
      error: (error) => {
        console.error('Erro ao criar venda:', error);
        this.authService.showSnackbar('Erro ao criar venda', 'error');
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
          this.authService.showSnackbar('Venda atualizada com sucesso!', 'success');
          this.loadStats(); // Recarrega estatísticas
        }
      },
      error: (error) => {
        console.error('Erro ao atualizar venda:', error);
        this.authService.showSnackbar('Erro ao atualizar venda', 'error');
      }
    });
  }

  /**
   * Confirma uma venda pendente
   */
  confirmarVenda(venda: Venda): void {
    if (venda.status !== 'Pendente') {
      this.authService.showSnackbar('Apenas vendas pendentes podem ser confirmadas', 'error');
      return;
    }

    this.vendaService.confirmarVenda(venda.id).subscribe({
      next: (vendaAtualizada) => {
        const vendas = this.vendas();
        const index = vendas.findIndex(v => v.id === vendaAtualizada.id);
        if (index !== -1) {
          const novasVendas = [...vendas];
          novasVendas[index] = vendaAtualizada;
          this.vendas.set(novasVendas);
          this.dataSource.data = this.vendas();
        }
        this.authService.showSnackbar(`Venda ${venda.numero} confirmada com sucesso!`, 'success');
        this.loadStats();
      },
      error: (error) => {
        console.error('Erro ao confirmar venda:', error);
        const mensagem = error.message || 'Erro ao confirmar venda';
        this.authService.showSnackbar(mensagem, 'error');
      }
    });
  }

  /**
   * Finaliza uma venda confirmada
   */
  finalizarVenda(venda: Venda): void {
    if (venda.status !== 'Confirmada') {
      this.authService.showSnackbar('Apenas vendas confirmadas podem ser finalizadas', 'error');
      return;
    }

    this.vendaService.finalizarVenda(venda.id).subscribe({
      next: (vendaAtualizada) => {
        const vendas = this.vendas();
        const index = vendas.findIndex(v => v.id === vendaAtualizada.id);
        if (index !== -1) {
          const novasVendas = [...vendas];
          novasVendas[index] = vendaAtualizada;
          this.vendas.set(novasVendas);
          this.dataSource.data = this.vendas();
        }
        this.authService.showSnackbar(`Venda ${venda.numero} finalizada com sucesso!`, 'success');
        this.loadStats();
      },
      error: (error) => {
        console.error('Erro ao finalizar venda:', error);
        const mensagem = error.message || 'Erro ao finalizar venda';
        this.authService.showSnackbar(mensagem, 'error');
      }
    });
  }

  /**
   * Processa uma venda completamente (Confirma → Finaliza)
   */
  processarVendaCompleta(venda: Venda): void {
    if (venda.status !== 'Pendente') {
      this.authService.showSnackbar('Apenas vendas pendentes podem ser processadas', 'error');
      return;
    }

    const confirmar = confirm(
      `Deseja processar completamente a venda ${venda.numero}?\n\n` +
      'Isso irá:\n' +
      '1. Confirmar a venda\n' +
      '2. Finalizar a venda automaticamente'
    );

    if (!confirmar) return;

    this.vendaService.processarVendaCompleta(venda.id).subscribe({
      next: (vendaFinalizada) => {
        const vendas = this.vendas();
        const index = vendas.findIndex(v => v.id === vendaFinalizada.id);
        if (index !== -1) {
          const novasVendas = [...vendas];
          novasVendas[index] = vendaFinalizada;
          this.vendas.set(novasVendas);
          this.dataSource.data = this.vendas();
        }
        this.authService.showSnackbar(`Venda ${venda.numero} processada e finalizada com sucesso!`, 'success');
        this.loadStats();
      },
      error: (error) => {
        console.error('Erro ao processar venda:', error);
        const mensagem = error.message || 'Erro ao processar venda';
        this.authService.showSnackbar(mensagem, 'error');
      }
    });
  }

  /**
   * Cancela uma venda
   */
  cancelarVenda(venda: Venda): void {
    if (venda.status !== 'Pendente' && venda.status !== 'Confirmada') {
      this.authService.showSnackbar('Apenas vendas pendentes ou confirmadas podem ser canceladas', 'error');
      return;
    }

    const confirmar = confirm(`Tem certeza que deseja cancelar a venda ${venda.numero}?`);
    if (!confirmar) return;

    this.vendaService.cancelarVenda(venda.id).subscribe({
      next: (vendaAtualizada) => {
        const vendas = this.vendas();
        const index = vendas.findIndex(v => v.id === vendaAtualizada.id);
        if (index !== -1) {
          const novasVendas = [...vendas];
          novasVendas[index] = vendaAtualizada;
          this.vendas.set(novasVendas);
          this.dataSource.data = this.vendas();
        }
        this.authService.showSnackbar(`Venda ${venda.numero} cancelada com sucesso!`, 'success');
        this.loadStats();
      },
      error: (error) => {
        console.error('Erro ao cancelar venda:', error);
        const mensagem = error.message || 'Erro ao cancelar venda';
        this.authService.showSnackbar(mensagem, 'error');
      }
    });
  }

  /**
   * Verifica se uma venda pode ser confirmada
   */
  podeConfirmar(venda: Venda): boolean {
    return this.vendaService.podeConfirmar(venda);
  }

  /**
   * Verifica se uma venda pode ser finalizada
   */
  podeFinalizar(venda: Venda): boolean {
    return this.vendaService.podeFinalizar(venda);
  }

  /**
   * Verifica se uma venda pode ser cancelada
   */
  podeCancelar(venda: Venda): boolean {
    return this.vendaService.podeCancelar(venda);
  }

  /**
   * Verifica se uma venda pode ser editada
   */
  podeEditar(venda: Venda): boolean {
    return this.vendaService.podeEditar(venda);
  }

  deleteVenda(venda: Venda): void {
    if (confirm(`Tem certeza que deseja excluir a venda ${venda.numero}?`)) {
      this.vendaService.deleteVenda(venda.id).subscribe({
        next: () => {
          const vendas = this.vendas();
          this.vendas.set(vendas.filter(v => v.id !== venda.id));
          this.dataSource.data = this.vendas();
          this.authService.showSnackbar('Venda excluída com sucesso!', 'success');
          this.loadStats(); // Recarrega estatísticas
        },
        error: (error) => {
          console.error('Erro ao excluir venda:', error);
          this.authService.showSnackbar('Erro ao excluir venda', 'error');
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
