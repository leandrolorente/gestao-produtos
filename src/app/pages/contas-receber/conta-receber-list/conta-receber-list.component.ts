import { AfterViewInit, Component, ViewChild, OnInit, signal } from '@angular/core';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ContaReceber, StatusContaReceber } from '../../../models/ContaReceber';
import { ContaReceberService } from '../../../services/conta-receber.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { ContaReceberDialogComponent } from '../../../components/conta-receber-dialog/conta-receber-dialog.component';

@Component({
  selector: 'app-conta-receber-list',
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
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule
  ],
  templateUrl: './conta-receber-list.component.html',
  styleUrls: ['./conta-receber-list.component.scss']
})
export class ContaReceberListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'numero',
    'descricao',
    'clienteNome',
    'vendedorNome',
    'valorOriginal',
    'valorRestante',
    'dataVencimento',
    'status',
    'actions'
  ];

  dataSource = new MatTableDataSource<ContaReceber>();
  @ViewChild(MatSort) sort!: MatSort;

  // Estados reativo
  isLoading = signal(false);
  totalPendente = signal(0);
  totalRecebido = signal(0);
  totalVencido = signal(0);
  quantidadePendente = signal(0);
  quantidadeRecebida = signal(0);
  quantidadeVencida = signal(0);

  // Formulário de filtros
  filterForm = new FormGroup({
    busca: new FormControl(''),
    status: new FormControl(''),
    dataInicio: new FormControl<Date | null>(null),
    dataFim: new FormControl<Date | null>(null)
  });

  // Arrays para selects
  statusOptions = [
    { value: StatusContaReceber.Pendente, label: 'Pendente' },
    { value: StatusContaReceber.Recebida, label: 'Recebida' },
    { value: StatusContaReceber.Cancelada, label: 'Cancelada' },
    { value: StatusContaReceber.Vencida, label: 'Vencida' },
    { value: StatusContaReceber.RecebimentoParcial, label: 'Recebimento Parcial' }
  ];

  constructor(
    public dialog: MatDialog,
    private contaReceberService: ContaReceberService,
    private snackBar: MatSnackBar,
    private confirmationService: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    this.loadContas();
    this.setupFilters();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.setupCustomFilter();
  }

  /**
   * Carrega todas as contas a receber
   */
  loadContas(): void {
    this.isLoading.set(true);
    this.contaReceberService.getAll().subscribe({
      next: (contas) => {
        this.dataSource.data = contas;
        this.calcularEstatisticas(contas);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar contas a receber:', error);
        this.showSnackBar('Erro ao carregar contas a receber', 'error');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Calcula estatísticas das contas
   */
  calcularEstatisticas(contas: ContaReceber[]): void {
    this.totalPendente.set(
      contas
        .filter(c => c.status === StatusContaReceber.Pendente)
        .reduce((sum, c) => sum + c.valorRestante, 0)
    );

    this.totalRecebido.set(
      contas
        .filter(c => c.status === StatusContaReceber.Recebida)
        .reduce((sum, c) => sum + c.valorRecebido, 0)
    );

    this.totalVencido.set(
      contas
        .filter(c => c.status === StatusContaReceber.Vencida)
        .reduce((sum, c) => sum + c.valorRestante, 0)
    );

    this.quantidadePendente.set(
      contas.filter(c => c.status === StatusContaReceber.Pendente).length
    );

    this.quantidadeRecebida.set(
      contas.filter(c => c.status === StatusContaReceber.Recebida).length
    );

    this.quantidadeVencida.set(
      contas.filter(c => c.status === StatusContaReceber.Vencida).length
    );
  }

  /**
   * Configurar filtros
   */
  setupFilters(): void {
    // Listener para mudanças nos filtros
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  /**
   * Configurar filtro customizado
   */
  setupCustomFilter(): void {
    this.dataSource.filterPredicate = (data: ContaReceber, filter: string) => {
      const filterObj = JSON.parse(filter);

      // Filtro por busca (descrição, cliente, número)
      if (filterObj.busca) {
        const busca = filterObj.busca.toLowerCase();
        const matchBusca = data.descricao.toLowerCase().includes(busca) ||
                          (data.clienteNome?.toLowerCase().includes(busca) || false) ||
                          data.numero.toLowerCase().includes(busca) ||
                          (data.vendedorNome?.toLowerCase().includes(busca) || false);
        if (!matchBusca) return false;
      }

      // Filtro por status
      if (filterObj.status && data.status !== parseInt(filterObj.status)) {
        return false;
      }

      // Filtro por período
      if (filterObj.dataInicio || filterObj.dataFim) {
        const dataVencimento = new Date(data.dataVencimento);

        if (filterObj.dataInicio) {
          const dataInicio = new Date(filterObj.dataInicio);
          if (dataVencimento < dataInicio) return false;
        }

        if (filterObj.dataFim) {
          const dataFim = new Date(filterObj.dataFim);
          if (dataVencimento > dataFim) return false;
        }
      }

      return true;
    };
  }

  /**
   * Aplica filtros
   */
  applyFilters(): void {
    const filterValue = {
      busca: this.filterForm.get('busca')?.value || '',
      status: this.filterForm.get('status')?.value || '',
      dataInicio: this.filterForm.get('dataInicio')?.value || '',
      dataFim: this.filterForm.get('dataFim')?.value || ''
    };

    this.dataSource.filter = JSON.stringify(filterValue);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

    // Recalcula estatísticas com dados filtrados
    this.calcularEstatisticas(this.dataSource.filteredData);
  }

  /**
   * Limpa filtros
   */
  clearFilters(): void {
    this.filterForm.reset();
    this.dataSource.filter = '';
    this.calcularEstatisticas(this.dataSource.data);
  }

  /**
   * Abre o dialog de conta a receber
   */
  openContaDialog(conta?: ContaReceber): void {
    const dialogRef = this.dialog.open(ContaReceberDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        conta: conta,
        isEdit: !!conta
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadContas();
      }
    });
  }

  /**
   * Receber conta
   */
  receberConta(conta: ContaReceber): void {
    // TODO: Implementar dialog de recebimento
    console.log('Receber conta:', conta);
  }

  /**
   * Cancelar conta
   */
  cancelarConta(conta: ContaReceber): void {
    this.confirmationService.confirmDelete(
      `conta "${conta.descricao}"`,
      {
        customMessage: `Tem certeza que deseja cancelar a conta "${conta.descricao}"?\n\nEsta ação não pode ser desfeita.`
      }
    ).subscribe(confirmed => {
      if (!confirmed) return;

      this.contaReceberService.cancelar(conta.id).subscribe({
        next: () => {
          this.loadContas();
          this.showSnackBar('Conta cancelada com sucesso!', 'success');
        },
        error: (error) => {
          console.error('Erro ao cancelar conta:', error);
          this.showSnackBar('Erro ao cancelar conta', 'error');
        }
      });
    });
  }

  /**
   * Deletar conta
   */
  deleteConta(conta: ContaReceber): void {
    this.confirmationService.confirmDelete(
      `conta "${conta.descricao}"`,
      {
        customMessage: `Tem certeza que deseja excluir a conta "${conta.descricao}"?\n\nTodos os dados serão perdidos permanentemente.`
      }
    ).subscribe(confirmed => {
      if (!confirmed) return;

      this.contaReceberService.delete(conta.id).subscribe({
        next: () => {
          this.loadContas();
          this.showSnackBar('Conta excluída com sucesso!', 'success');
        },
        error: (error) => {
          console.error('Erro ao excluir conta:', error);
          this.showSnackBar('Erro ao excluir conta', 'error');
        }
      });
    });
  }

  /**
   * Exportar para CSV
   */
  exportToCsv(): void {
    const data = this.dataSource.filteredData;

    if (data.length === 0) {
      this.showSnackBar('Nenhum dado para exportar', 'warning');
      return;
    }

    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `contas-receber-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Converte dados para CSV
   */
  private convertToCSV(data: ContaReceber[]): string {
    const headers = [
      'Número',
      'Descrição',
      'Cliente',
      'Vendedor',
      'Valor Original',
      'Valor Recebido',
      'Valor Restante',
      'Data Emissão',
      'Data Vencimento',
      'Data Recebimento',
      'Status',
      'Observações'
    ];

    const csvData = data.map(conta => [
      conta.numero,
      conta.descricao,
      conta.clienteNome || '',
      conta.vendedorNome || '',
      conta.valorOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      conta.valorRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      conta.valorRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      new Date(conta.dataEmissao).toLocaleDateString('pt-BR'),
      new Date(conta.dataVencimento).toLocaleDateString('pt-BR'),
      conta.dataRecebimento ? new Date(conta.dataRecebimento).toLocaleDateString('pt-BR') : '',
      this.getStatusLabel(conta.status),
      conta.observacoes || ''
    ]);

    const csvString = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvString;
  }

  /**
   * Obtém label do status
   */
  getStatusLabel(status: StatusContaReceber): string {
    const option = this.statusOptions.find(s => s.value === status);
    return option?.label || 'Desconhecido';
  }

  /**
   * Obtém cor do status
   */
  getStatusColor(status: StatusContaReceber): string {
    switch (status) {
      case StatusContaReceber.Pendente: return 'warn';
      case StatusContaReceber.Recebida: return 'primary';
      case StatusContaReceber.Cancelada: return '';
      case StatusContaReceber.Vencida: return 'warn';
      case StatusContaReceber.RecebimentoParcial: return 'accent';
      default: return '';
    }
  }

  /**
   * Formata valor como moeda
   */
  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  /**
   * Formata data
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  /**
   * Verifica se conta está vencida
   */
  isVencida(conta: ContaReceber): boolean {
    return conta.estaVencida && conta.status === StatusContaReceber.Pendente;
  }

  /**
   * Exibe snackbar
   */
  private showSnackBar(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    this.snackBar.open(message, 'Fechar', {
      duration: type === 'error' ? 5000 : 3000,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
