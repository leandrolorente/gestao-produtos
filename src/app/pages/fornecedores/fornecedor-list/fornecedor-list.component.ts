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
import { FornecedorDialogComponent } from '../../../components/fornecedor-dialog/fornecedor-dialog.component';
import { Fornecedor, StatusFornecedor, TipoFornecedor } from '../../../models/Fornecedor';
import { FornecedorService } from '../../../services/fornecedor.service';

@Component({
  selector: 'app-fornecedor-list',
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
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './fornecedor-list.component.html',
  styleUrls: ['./fornecedor-list.component.scss']
})
export class FornecedorListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'nomeFantasia',
    'cnpjCpf',
    'tipo',
    'email',
    'status',
    'totalComprado',
    'actions'
  ];
  
  dataSource = new MatTableDataSource<Fornecedor>([]);
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = signal(false);
  statusFornecedor = StatusFornecedor;
  tipoFornecedor = TipoFornecedor;

  // Estatísticas
  totalFornecedores = signal(0);
  fornecedoresAtivos = signal(0);
  fornecedoresInativos = signal(0);
  fornecedoresBloqueados = signal(0);

  constructor(
    public dialog: MatDialog,
    private fornecedorService: FornecedorService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadFornecedores();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    
    // Configurar filtro customizado
    this.dataSource.filterPredicate = (data: Fornecedor, filter: string) => {
      const searchTerm = filter.toLowerCase();
      return (
        (data.nomeFantasia?.toLowerCase().includes(searchTerm) ?? false) ||
        data.razaoSocial.toLowerCase().includes(searchTerm) ||
        data.cnpjCpf.toLowerCase().includes(searchTerm) ||
        data.email.toLowerCase().includes(searchTerm) ||
        data.telefone.toLowerCase().includes(searchTerm)
      );
    };
  }

  /**
   * Carrega todos os fornecedores
   */
  loadFornecedores(): void {
    this.isLoading.set(true);
    this.fornecedorService.getAll().subscribe({
      next: (fornecedores) => {
        this.dataSource.data = fornecedores;
        this.calcularEstatisticas(fornecedores);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar fornecedores:', error);
        this.showSnackBar('Erro ao carregar fornecedores', 'error');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Calcula estatísticas dos fornecedores
   */
  private calcularEstatisticas(fornecedores: Fornecedor[]): void {
    this.totalFornecedores.set(fornecedores.length);
    this.fornecedoresAtivos.set(
      fornecedores.filter(f => f.status === StatusFornecedor.Ativo).length
    );
    this.fornecedoresInativos.set(
      fornecedores.filter(f => f.status === StatusFornecedor.Inativo).length
    );
    this.fornecedoresBloqueados.set(
      fornecedores.filter(f => f.status === StatusFornecedor.Bloqueado).length
    );
  }

  /**
   * Aplica filtro na tabela
   */
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim();
    this.dataSource.filter = filterValue.toLowerCase();

    // Se não encontrou nada e parece ser CNPJ/CPF, busca na API
    if (filterValue && this.dataSource.filteredData.length === 0 && this.isCnpjCpf(filterValue)) {
      this.searchByCnpj(filterValue);
    }
  }

  /**
   * Verifica se é um CNPJ/CPF válido
   */
  private isCnpjCpf(value: string): boolean {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 11 || cleaned.length === 14;
  }

  /**
   * Busca fornecedor por CNPJ/CPF
   */
  private searchByCnpj(cnpjCpf: string): void {
    this.fornecedorService.getByCnpj(cnpjCpf).subscribe({
      next: (fornecedor) => {
        this.dataSource.data = [fornecedor];
      },
      error: (error) => {
        console.error('Fornecedor não encontrado:', error);
        this.showSnackBar('Fornecedor não encontrado', 'warning');
      }
    });
  }

  /**
   * Limpa o filtro
   */
  clearFilter(searchInput: HTMLInputElement): void {
    searchInput.value = '';
    this.dataSource.filter = '';
  }

  /**
   * Abre o dialog de fornecedor
   */
  openFornecedorDialog(fornecedor?: Fornecedor): void {
    const dialogRef = this.dialog.open(FornecedorDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: fornecedor ? { ...fornecedor } : null,
      disableClose: true,
      panelClass: 'custom-dialog',
      autoFocus: false,
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result.id) {
          this.updateFornecedor(result);
        } else {
          this.createFornecedor(result);
        }
      }
    });
  }

  /**
   * Cria um novo fornecedor
   */
  private createFornecedor(fornecedorData: any): void {
    this.isLoading.set(true);
    console.log('🚀 Criando fornecedor com dados:', fornecedorData);
    
    this.fornecedorService.create(fornecedorData).subscribe({
      next: (newFornecedor) => {
        console.log('✅ Fornecedor criado:', newFornecedor);
        this.dataSource.data = [...this.dataSource.data, newFornecedor];
        this.calcularEstatisticas(this.dataSource.data);
        this.showSnackBar('Fornecedor criado com sucesso!', 'success');
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Erro ao criar fornecedor:', error);
        console.error('Status:', error.status);
        console.error('Mensagem:', error.error);
        
        let errorMessage = 'Erro ao criar fornecedor';
        if (error.error?.errors) {
          const errors = Object.values(error.error.errors).flat();
          errorMessage = errors.join(', ');
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.showSnackBar(errorMessage, 'error');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Atualiza um fornecedor existente
   */
  private updateFornecedor(fornecedorData: Fornecedor): void {
    this.isLoading.set(true);
    this.fornecedorService.update(fornecedorData.id, fornecedorData).subscribe({
      next: (updatedFornecedor) => {
        const data = this.dataSource.data;
        const index = data.findIndex((f) => f.id === updatedFornecedor.id);
        if (index > -1) {
          data[index] = updatedFornecedor;
          this.dataSource.data = [...data];
          this.calcularEstatisticas(this.dataSource.data);
        }
        this.showSnackBar('Fornecedor atualizado com sucesso!', 'success');
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao atualizar fornecedor:', error);
        this.showSnackBar('Erro ao atualizar fornecedor', 'error');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Ativa um fornecedor
   */
  ativarFornecedor(fornecedor: Fornecedor): void {
    this.fornecedorService.ativar(fornecedor.id).subscribe({
      next: () => {
        fornecedor.status = StatusFornecedor.Ativo;
        this.dataSource.data = [...this.dataSource.data];
        this.calcularEstatisticas(this.dataSource.data);
        this.showSnackBar('Fornecedor ativado com sucesso!', 'success');
      },
      error: (error) => {
        console.error('Erro ao ativar fornecedor:', error);
        this.showSnackBar('Erro ao ativar fornecedor', 'error');
      }
    });
  }

  /**
   * Inativa um fornecedor
   */
  inativarFornecedor(fornecedor: Fornecedor): void {
    this.fornecedorService.inativar(fornecedor.id).subscribe({
      next: () => {
        fornecedor.status = StatusFornecedor.Inativo;
        this.dataSource.data = [...this.dataSource.data];
        this.calcularEstatisticas(this.dataSource.data);
        this.showSnackBar('Fornecedor inativado com sucesso!', 'success');
      },
      error: (error) => {
        console.error('Erro ao inativar fornecedor:', error);
        this.showSnackBar('Erro ao inativar fornecedor', 'error');
      }
    });
  }

  /**
   * Bloqueia um fornecedor
   */
  bloquearFornecedor(fornecedor: Fornecedor): void {
    const motivo = prompt('Digite o motivo do bloqueio:');
    if (!motivo) return;

    this.fornecedorService.bloquear(fornecedor.id, {
      motivo
    }).subscribe({
      next: () => {
        fornecedor.status = StatusFornecedor.Bloqueado;
        this.dataSource.data = [...this.dataSource.data];
        this.calcularEstatisticas(this.dataSource.data);
        this.showSnackBar('Fornecedor bloqueado com sucesso!', 'success');
      },
      error: (error) => {
        console.error('Erro ao bloquear fornecedor:', error);
        this.showSnackBar('Erro ao bloquear fornecedor', 'error');
      }
    });
  }

  /**
   * Desbloqueia um fornecedor
   */
  desbloquearFornecedor(fornecedor: Fornecedor): void {
    this.fornecedorService.desbloquear(fornecedor.id).subscribe({
      next: () => {
        fornecedor.status = StatusFornecedor.Ativo;
        this.dataSource.data = [...this.dataSource.data];
        this.calcularEstatisticas(this.dataSource.data);
        this.showSnackBar('Fornecedor desbloqueado com sucesso!', 'success');
      },
      error: (error) => {
        console.error('Erro ao desbloquear fornecedor:', error);
        this.showSnackBar('Erro ao desbloquear fornecedor', 'error');
      }
    });
  }

  /**
   * Deleta um fornecedor (soft delete)
   */
  deleteFornecedor(fornecedor: Fornecedor): void {
    if (!confirm(`Deseja realmente excluir o fornecedor "${fornecedor.nomeFantasia}"?`)) {
      return;
    }

    this.fornecedorService.delete(fornecedor.id).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(f => f.id !== fornecedor.id);
        this.calcularEstatisticas(this.dataSource.data);
        this.showSnackBar('Fornecedor excluído com sucesso!', 'success');
      },
      error: (error) => {
        console.error('Erro ao excluir fornecedor:', error);
        this.showSnackBar('Erro ao excluir fornecedor', 'error');
      }
    });
  }

  /**
   * Retorna a classe CSS para o chip de status
   */
  getStatusClass(status: StatusFornecedor): string {
    switch (status) {
      case StatusFornecedor.Ativo:
        return 'status-ativo';
      case StatusFornecedor.Inativo:
        return 'status-inativo';
      case StatusFornecedor.Bloqueado:
        return 'status-bloqueado';
      default:
        return '';
    }
  }

  /**
   * Retorna o ícone para o tipo de fornecedor
   */
  getTipoIcon(tipo: TipoFornecedor): string {
    return tipo === TipoFornecedor.Nacional ? 'flag' : 'public';
  }

  /**
   * Retorna o label para o tipo de fornecedor
   */
  getTipoLabel(tipo: TipoFornecedor): string {
    return tipo === TipoFornecedor.Nacional ? 'Nacional' : 'Internacional';
  }

  /**
   * Retorna o label para o status
   */
  getStatusLabel(status: StatusFornecedor): string {
    switch (status) {
      case StatusFornecedor.Ativo:
        return 'Ativo';
      case StatusFornecedor.Inativo:
        return 'Inativo';
      case StatusFornecedor.Bloqueado:
        return 'Bloqueado';
      default:
        return '';
    }
  }

  /**
   * Formata CNPJ/CPF
   */
  formatCnpjCpf(cnpjCpf: string): string {
    const cleaned = cnpjCpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (cleaned.length === 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cnpjCpf;
  }

  /**
   * Formata telefone
   */
  formatTelefone(telefone: string | undefined): string {
    if (!telefone) return '-';
    const cleaned = telefone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }

  /**
   * Formata valor monetário
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Mostra snackbar
   */
  private showSnackBar(message: string, type: 'success' | 'error' | 'warning'): void {
    const duration = type === 'error' ? 5000 : 3000; // Erros ficam mais tempo
    this.snackBar.open(message, 'Fechar', {
      duration,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Exporta para CSV
   */
  exportToCsv(): void {
    const data = this.dataSource.filteredData;
    if (data.length === 0) {
      this.showSnackBar('Nenhum dado para exportar', 'warning');
      return;
    }

    const headers = [
      'Nome Fantasia',
      'Razão Social',
      'CNPJ/CPF',
      'Tipo',
      'Email',
      'Telefone',
      'Status',
      'Total Compras',
      'Última Compra'
    ];

    const csvData = data.map(f => [
      f.nomeFantasia || f.razaoSocial,
      f.razaoSocial,
      this.formatCnpjCpf(f.cnpjCpf),
      f.tipo,
      f.email,
      this.formatTelefone(f.telefone),
      f.status,
      this.formatCurrency(f.totalComprado || 0),
      f.ultimaCompra ? new Date(f.ultimaCompra).toLocaleDateString('pt-BR') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fornecedores_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    this.showSnackBar('Exportação concluída!', 'success');
  }
}
