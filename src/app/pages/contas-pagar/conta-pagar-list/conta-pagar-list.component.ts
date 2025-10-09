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

import { ContaPagar, StatusContaPagar, CategoriaConta } from '../../../models/ContaPagar';
import { ContaPagarService } from '../../../services/conta-pagar.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { ContaPagarDialogComponent } from '../../../components/conta-pagar-dialog/conta-pagar-dialog.component';

@Component({
  selector: 'app-conta-pagar-list',
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
  templateUrl: './conta-pagar-list.component.html',
  styleUrls: ['./conta-pagar-list.component.scss']
})
export class ContaPagarListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'numero',
    'descricao',
    'fornecedorNome',
    'categoria',
    'valorOriginal',
    'valorRestante',
    'dataVencimento',
    'status',
    'actions'
  ];

  dataSource = new MatTableDataSource<ContaPagar>();
  @ViewChild(MatSort) sort!: MatSort;

  // Estados reativo
  isLoading = signal(false);
  totalPendente = signal(0);
  totalPago = signal(0);
  totalVencido = signal(0);
  quantidadePendente = signal(0);
  quantidadePaga = signal(0);
  quantidadeVencida = signal(0);

  // Formulário de filtros
  filterForm = new FormGroup({
    busca: new FormControl(''),
    status: new FormControl(''),
    categoria: new FormControl(''),
    dataInicio: new FormControl<Date | null>(null),
    dataFim: new FormControl<Date | null>(null)
  });

  // Arrays para selects
  statusOptions = [
    { value: StatusContaPagar.Pendente, label: 'Pendente' },
    { value: StatusContaPagar.Paga, label: 'Paga' },
    { value: StatusContaPagar.Cancelada, label: 'Cancelada' },
    { value: StatusContaPagar.Vencida, label: 'Vencida' },
    { value: StatusContaPagar.PagamentoParcial, label: 'Pagamento Parcial' }
  ];

  categoriaOptions = [
    { value: CategoriaConta.Fornecedores, label: 'Fornecedores' },
    { value: CategoriaConta.Funcionarios, label: 'Funcionários' },
    { value: CategoriaConta.Impostos, label: 'Impostos' },
    { value: CategoriaConta.Aluguel, label: 'Aluguel' },
    { value: CategoriaConta.Energia, label: 'Energia' },
    { value: CategoriaConta.Telefone, label: 'Telefone' },
    { value: CategoriaConta.Internet, label: 'Internet' },
    { value: CategoriaConta.Marketing, label: 'Marketing' },
    { value: CategoriaConta.Manutencao, label: 'Manutenção' },
    { value: CategoriaConta.Combustivel, label: 'Combustível' },
    { value: CategoriaConta.Outros, label: 'Outros' }
  ];

  constructor(
    public dialog: MatDialog,
    private contaPagarService: ContaPagarService,
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
   * Carrega todas as contas a pagar
   */
  loadContas(): void {
    this.isLoading.set(true);
    this.contaPagarService.getAll().subscribe({
      next: (contas) => {
        this.dataSource.data = contas;
        this.calcularEstatisticas(contas);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar contas a pagar:', error);
        this.showSnackBar('Erro ao carregar contas a pagar', 'error');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Calcula estatísticas das contas
   */
  calcularEstatisticas(contas: ContaPagar[]): void {
    this.totalPendente.set(
      contas
        .filter(c => c.status === StatusContaPagar.Pendente)
        .reduce((sum, c) => sum + c.valorRestante, 0)
    );

    this.totalPago.set(
      contas
        .filter(c => c.status === StatusContaPagar.Paga)
        .reduce((sum, c) => sum + c.valorPago, 0)
    );

    this.totalVencido.set(
      contas
        .filter(c => c.status === StatusContaPagar.Vencida)
        .reduce((sum, c) => sum + c.valorRestante, 0)
    );

    this.quantidadePendente.set(
      contas.filter(c => c.status === StatusContaPagar.Pendente).length
    );

    this.quantidadePaga.set(
      contas.filter(c => c.status === StatusContaPagar.Paga).length
    );

    this.quantidadeVencida.set(
      contas.filter(c => c.status === StatusContaPagar.Vencida).length
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
    this.dataSource.filterPredicate = (data: ContaPagar, filter: string) => {
      const filterObj = JSON.parse(filter);

      // Filtro por busca (descrição, fornecedor, número)
      if (filterObj.busca) {
        const busca = filterObj.busca.toLowerCase();
        const matchBusca = data.descricao.toLowerCase().includes(busca) ||
                          (data.fornecedorNome?.toLowerCase().includes(busca) || false) ||
                          data.numero.toLowerCase().includes(busca);
        if (!matchBusca) return false;
      }

      // Filtro por status
      if (filterObj.status && data.status !== parseInt(filterObj.status)) {
        return false;
      }

      // Filtro por categoria
      if (filterObj.categoria && data.categoria !== parseInt(filterObj.categoria)) {
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
      categoria: this.filterForm.get('categoria')?.value || '',
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
   * Abre o dialog de conta a pagar
   */
  openContaDialog(conta?: ContaPagar): void {
    const dialogRef = this.dialog.open(ContaPagarDialogComponent, {
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
   * Pagar conta
   */
  pagarConta(conta: ContaPagar): void {
    // TODO: Implementar dialog de pagamento
    console.log('Pagar conta:', conta);
  }

  /**
   * Cancelar conta
   */
  cancelarConta(conta: ContaPagar): void {
    this.confirmationService.confirmDelete(
      `conta "${conta.descricao}"`,
      {
        customMessage: `Tem certeza que deseja cancelar a conta "${conta.descricao}"?\n\nEsta ação não pode ser desfeita.`
      }
    ).subscribe(confirmed => {
      if (!confirmed) return;

      this.contaPagarService.cancelar(conta.id).subscribe({
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
  deleteConta(conta: ContaPagar): void {
    this.confirmationService.confirmDelete(
      `conta "${conta.descricao}"`,
      {
        customMessage: `Tem certeza que deseja excluir a conta "${conta.descricao}"?\n\nTodos os dados serão perdidos permanentemente.`
      }
    ).subscribe(confirmed => {
      if (!confirmed) return;

      this.contaPagarService.delete(conta.id).subscribe({
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
      link.setAttribute('download', `contas-pagar-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Converte dados para CSV
   */
  private convertToCSV(data: ContaPagar[]): string {
    const headers = [
      'Número',
      'Descrição',
      'Fornecedor',
      'Categoria',
      'Valor Original',
      'Valor Pago',
      'Valor Restante',
      'Data Emissão',
      'Data Vencimento',
      'Data Pagamento',
      'Status',
      'Observações'
    ];

    const csvData = data.map(conta => [
      conta.numero,
      conta.descricao,
      conta.fornecedorNome || '',
      this.getCategoriaLabel(conta.categoria),
      conta.valorOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      conta.valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      conta.valorRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      new Date(conta.dataEmissao).toLocaleDateString('pt-BR'),
      new Date(conta.dataVencimento).toLocaleDateString('pt-BR'),
      conta.dataPagamento ? new Date(conta.dataPagamento).toLocaleDateString('pt-BR') : '',
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
  getStatusLabel(status: StatusContaPagar): string {
    const option = this.statusOptions.find(s => s.value === status);
    return option?.label || 'Desconhecido';
  }

  /**
   * Obtém cor do status
   */
  getStatusColor(status: StatusContaPagar): string {
    switch (status) {
      case StatusContaPagar.Pendente: return 'warn';
      case StatusContaPagar.Paga: return 'primary';
      case StatusContaPagar.Cancelada: return '';
      case StatusContaPagar.Vencida: return 'warn';
      case StatusContaPagar.PagamentoParcial: return 'accent';
      default: return '';
    }
  }

  /**
   * Obtém label da categoria
   */
  getCategoriaLabel(categoria: CategoriaConta): string {
    const option = this.categoriaOptions.find(c => c.value === categoria);
    return option?.label || 'Outros';
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
  isVencida(conta: ContaPagar): boolean {
    return conta.estaVencida && conta.status === StatusContaPagar.Pendente;
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
