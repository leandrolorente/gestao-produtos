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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ContaReceber, StatusContaReceber, RecebimentoConta } from '../../../models/ContaReceber';
import { FormaPagamento } from '../../../models/ContaPagar';
import { ContaReceberService } from '../../../services/conta-receber.service';
import { AuthService } from '../../../services/auth.service';
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
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule
  ],
  templateUrl: './conta-receber-list.component.html',
  styleUrls: ['./conta-receber-list.component.scss']
})
export class ContaReceberListComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;

  // Signals para estado
  contas = signal<ContaReceber[]>([]);
  loading = signal<boolean>(false);

  // DataSource para a tabela
  dataSource = new MatTableDataSource<ContaReceber>([]);

  // Colunas da tabela
  displayedColumns: string[] = [
    'numero',
    'descricao',
    'clienteNome',
    'valorOriginal',
    'valorRestante',
    'dataVencimento',
    'status',
    'acoes'
  ];

  // Filtros
  searchControl = new FormControl('');
  statusFilter = new FormControl('');
  dateRangeStart = new FormControl<Date | null>(null);
  dateRangeEnd = new FormControl<Date | null>(null);

  // Opções para filtros
  statusOptions = [
    { value: '', label: 'Todos' },
    { value: StatusContaReceber.Pendente, label: 'Pendente' },
    { value: StatusContaReceber.Recebida, label: 'Recebida' },
    { value: StatusContaReceber.Cancelada, label: 'Cancelada' },
    { value: StatusContaReceber.Vencida, label: 'Vencida' },
    { value: StatusContaReceber.RecebimentoParcial, label: 'Recebimento Parcial' }
  ];

  // Computed para estatísticas resumidas
  contasHoje = computed(() => {
    const hoje = new Date().toDateString();
    return this.contas().filter(conta =>
      new Date(conta.dataVencimento).toDateString() === hoje
    ).length;
  });

  totalPendente = computed(() => {
    return this.contas()
      .filter(conta => conta.status === StatusContaReceber.Pendente)
      .reduce((total, conta) => total + conta.valorRestante, 0);
  });

  totalRecebido = computed(() => {
    return this.contas()
      .filter(conta => conta.status === StatusContaReceber.Recebida)
      .reduce((total, conta) => total + conta.valorRecebido, 0);
  });

  totalVencido = computed(() => {
    return this.contas()
      .filter(conta => conta.status === StatusContaReceber.Vencida)
      .reduce((total, conta) => total + conta.valorRestante, 0);
  });

  quantidadePendente = computed(() => {
    return this.contas().filter(conta => conta.status === StatusContaReceber.Pendente).length;
  });

  constructor(
    private contaReceberService: ContaReceberService,
    private dialog: MatDialog,
    private authService: AuthService,
    private confirmationService: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    this.loadContas();
    this.setupFilters();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  // Verifica se o usuário é admin
  isAdmin(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.role === 'admin';
  }

  private loadContas(): void {
    this.loading.set(true);

    this.contaReceberService.getAll().subscribe({
      next: (contas) => {
        this.contas.set(contas);
        this.dataSource.data = contas;
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar contas a receber:', error);
        this.authService.showSnackbar('Erro ao carregar contas a receber', 'error');
        this.loading.set(false);
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

    // Filtros de status e datas
    this.statusFilter.valueChanges.subscribe(() => this.applyFilters());
    this.dateRangeStart.valueChanges.subscribe(() => this.applyFilters());
    this.dateRangeEnd.valueChanges.subscribe(() => this.applyFilters());
  }

  private applyFilters(): void {
    let filteredData = [...this.contas()];

    // Filtro de busca
    const searchTerm = this.searchControl.value?.toLowerCase();
    if (searchTerm) {
      filteredData = filteredData.filter(conta =>
        conta.numero.toLowerCase().includes(searchTerm) ||
        conta.descricao.toLowerCase().includes(searchTerm) ||
        (conta.clienteNome?.toLowerCase().includes(searchTerm) || false) ||
        (conta.vendedorNome?.toLowerCase().includes(searchTerm) || false)
      );
    }

    // Filtro de status
    const statusSelected = this.statusFilter.value;
    if (statusSelected !== null && statusSelected !== '') {
      filteredData = filteredData.filter(conta => conta.status === Number(statusSelected));
    }

    // Filtro de período
    const dataInicio = this.dateRangeStart.value;
    const dataFim = this.dateRangeEnd.value;

    if (dataInicio) {
      filteredData = filteredData.filter(conta => 
        new Date(conta.dataVencimento) >= dataInicio
      );
    }

    if (dataFim) {
      filteredData = filteredData.filter(conta => 
        new Date(conta.dataVencimento) <= dataFim
      );
    }

    this.dataSource.data = filteredData;
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusFilter.setValue('');
    this.dateRangeStart.setValue(null);
    this.dateRangeEnd.setValue(null);
    this.dataSource.data = this.contas();
  }

  openCreateDialog(): void {
    this.openContaDialog();
  }

  openContaDialog(conta?: ContaReceber): void {
    const dialogRef = this.dialog.open(ContaReceberDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { conta: conta, editMode: !!conta },
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadContas();
      }
    });
  }

  /**
   * Handle double-click on table row (excluding actions column)
   */
  onRowDoubleClick(event: Event, conta: ContaReceber): void {
    const target = event.target as HTMLElement;
    
    // Ignore clicks on actions column
    if (target.closest('.actions-column') || 
        target.closest('button') || 
        target.closest('.non-clickable')) {
      return;
    }
    
    // Only allow edit if conta can be edited
    if (this.canEdit(conta)) {
      this.openContaDialog(conta);
    }
  }

  receberConta(conta: ContaReceber): void {
    if (conta.status !== StatusContaReceber.Pendente && conta.status !== StatusContaReceber.RecebimentoParcial) {
      this.authService.showSnackbar('Apenas contas pendentes podem ser recebidas', 'error');
      return;
    }

    this.confirmationService.confirmAction(
      'Receber Conta',
      `Deseja receber a conta ${conta.numero}?`,
      'Receber',
      {
        icon: 'payment',
        iconColor: 'primary',
        actionColor: 'primary'
      }
    ).subscribe(confirmed => {
      if (!confirmed) return;

      this.contaReceberService.receber(conta.id, {
        valor: conta.valorRestante,
        formaPagamento: FormaPagamento.PIX, // Padrão PIX, poderia ser um dialog para escolher
        dataRecebimento: new Date().toISOString()
      }).subscribe({
        next: () => {
          this.loadContas();
          this.authService.showSnackbar(`Conta ${conta.numero} recebida com sucesso!`, 'success');
        },
        error: (error) => {
          console.error('Erro ao receber conta:', error);
          this.authService.showSnackbar('Erro ao receber conta', 'error');
        }
      });
    });
  }

  cancelarConta(conta: ContaReceber): void {
    if (conta.status === StatusContaReceber.Recebida || conta.status === StatusContaReceber.Cancelada) {
      this.authService.showSnackbar('Esta conta não pode ser cancelada', 'error');
      return;
    }

    this.confirmationService.confirmAction(
      'Cancelar Conta',
      `Tem certeza que deseja cancelar a conta ${conta.numero}?\n\nEsta ação não pode ser desfeita.`,
      'Cancelar',
      {
        icon: 'cancel',
        iconColor: 'warn',
        actionColor: 'warn'
      }
    ).subscribe(confirmed => {
      if (!confirmed) return;

      this.contaReceberService.cancelar(conta.id).subscribe({
        next: () => {
          this.loadContas();
          this.authService.showSnackbar(`Conta ${conta.numero} cancelada com sucesso!`, 'success');
        },
        error: (error) => {
          console.error('Erro ao cancelar conta:', error);
          this.authService.showSnackbar('Erro ao cancelar conta', 'error');
        }
      });
    });
  }

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
          const contas = this.contas();
          this.contas.set(contas.filter(c => c.id !== conta.id));
          this.dataSource.data = this.contas();
          this.authService.showSnackbar('Conta excluída com sucesso!', 'success');
        },
        error: (error) => {
          console.error('Erro ao excluir conta:', error);
          this.authService.showSnackbar('Erro ao excluir conta', 'error');
        }
      });
    });
  }

  /**
   * Verifica se uma conta pode ser recebida
   */
  podeReceber(conta: ContaReceber): boolean {
    return conta.status === StatusContaReceber.Pendente || conta.status === StatusContaReceber.RecebimentoParcial;
  }

  /**
   * Verifica se uma conta pode ser cancelada
   */
  podeCancelar(conta: ContaReceber): boolean {
    return conta.status !== StatusContaReceber.Recebida && conta.status !== StatusContaReceber.Cancelada;
  }

  /**
   * Verifica se uma conta pode ser editada
   */
  canEdit(conta: ContaReceber): boolean {
    return conta.status !== StatusContaReceber.Cancelada;
  }

  exportToCsv(): void {
    const headers = ['Número', 'Descrição', 'Cliente', 'Valor Original', 'Valor Recebido', 'Valor Restante', 'Data Emissão', 'Data Vencimento', 'Status', 'Observações'];
    const csvData = this.dataSource.data.map(conta => [
      conta.numero,
      conta.descricao,
      conta.clienteNome || '',
      conta.valorOriginal.toFixed(2).replace('.', ','),
      conta.valorRecebido.toFixed(2).replace('.', ','),
      conta.valorRestante.toFixed(2).replace('.', ','),
      this.formatDate(conta.dataEmissao),
      this.formatDate(conta.dataVencimento),
      this.getStatusLabel(conta.status),
      conta.observacoes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(';'))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `contas-receber_${this.formatDate(new Date())}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  getStatusLabel(status: StatusContaReceber): string {
    const option = this.statusOptions.find(s => s.value === status);
    return option?.label || 'Desconhecido';
  }

  getStatusChipColor(status: StatusContaReceber): string {
    switch (status) {
      case StatusContaReceber.Pendente: return 'warn';
      case StatusContaReceber.Recebida: return 'primary';
      case StatusContaReceber.Cancelada: return '';
      case StatusContaReceber.Vencida: return 'warn';
      case StatusContaReceber.RecebimentoParcial: return 'accent';
      default: return '';
    }
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  isVencida(conta: ContaReceber): boolean {
    return conta.estaVencida && conta.status === StatusContaReceber.Pendente;
  }
}