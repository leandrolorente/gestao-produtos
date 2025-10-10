import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { ContaReceber, StatusContaReceber, CreateContaReceber, UpdateContaReceber } from '../../models/ContaReceber';
import { FormaPagamento, TipoRecorrencia } from '../../models/ContaPagar';
import { Cliente } from '../../models/Cliente';
import { User } from '../../models/User';
import { ContaReceberService } from '../../services/conta-receber.service';
import { ClienteService } from '../../services/cliente.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

export interface ContaReceberDialogData {
  conta?: ContaReceber;
  isEdit: boolean;
}

@Component({
  selector: 'app-conta-receber-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatAutocompleteModule
  ],
  templateUrl: './conta-receber-dialog.component.html',
  styleUrls: ['./conta-receber-dialog.component.scss']
})
export class ContaReceberDialogComponent implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  form: FormGroup;
  isLoading = signal(false);
  isSaving = signal(false);

  // Signals para dados de autocomplete
  clientes = signal<Cliente[]>([]);
  vendedores = signal<User[]>([]);
  clientesFiltrados = signal<Cliente[]>([]);
  vendedoresFiltrados = signal<User[]>([]);

  // Enums para selects
  formasPagamento = [
    { value: FormaPagamento.Dinheiro, label: 'Dinheiro' },
    { value: FormaPagamento.PIX, label: 'PIX' },
    { value: FormaPagamento.CartaoCredito, label: 'Cartão de Crédito' },
    { value: FormaPagamento.CartaoDebito, label: 'Cartão de Débito' },
    { value: FormaPagamento.Transferencia, label: 'Transferência Bancária' },
    { value: FormaPagamento.Boleto, label: 'Boleto Bancário' },
    { value: FormaPagamento.Cheque, label: 'Cheque' }
  ];

  tiposRecorrencia = [
    { value: TipoRecorrencia.Mensal, label: 'Mensal' },
    { value: TipoRecorrencia.Trimestral, label: 'Trimestral' },
    { value: TipoRecorrencia.Anual, label: 'Anual' }
  ];

  constructor(
    private fb: FormBuilder,
    private contaReceberService: ContaReceberService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ContaReceberDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ContaReceberDialogData
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    this.loadClientes();
    this.loadVendedores();
    
    if (this.data.isEdit && this.data.conta) {
      this.loadContaData();
    }
  }

  /**
   * Carrega lista de clientes
   */
  private loadClientes(): void {
    this.clienteService.getAllClientes().subscribe({
      next: (clientes: Cliente[]) => {
        this.clientes.set(clientes);
      },
      error: (error: any) => {
        console.error('Erro ao carregar clientes:', error);
        this.authService.showSnackbar('Erro ao carregar clientes', 'error');
      }
    });
  }

  /**
   * Carrega lista de vendedores (usuários)
   */
  private loadVendedores(): void {
    this.userService.getAllUsers().subscribe({
      next: (users: User[]) => {
        // Filtrar apenas usuários ativos que podem ser vendedores
        const vendedores = users.filter(user => user.isActive !== false);
        this.vendedores.set(vendedores);
      },
      error: (error: any) => {
        console.error('Erro ao carregar vendedores:', error);
        this.authService.showSnackbar('Erro ao carregar vendedores', 'error');
      }
    });
  }

  /**
   * Cria o formulário
   */
  private createForm(): FormGroup {
    return this.fb.group({
      numero: ['', Validators.required],
      descricao: ['', [Validators.required, Validators.minLength(3)]],
      clienteId: [''],
      clienteNome: [''],
      vendedorId: [''],
      vendedorNome: [''],
      valorOriginal: [0, [Validators.required, Validators.min(0.01)]],
      desconto: [0],
      dataEmissao: [new Date(), Validators.required],
      dataVencimento: [null, Validators.required],
      observacoes: [''],
      ehRecorrente: [false],
      tipoRecorrencia: [undefined]
    });
  }

  /**
   * Carrega dados da conta para edição
   */
  private loadContaData(): void {
    if (!this.data.conta) return;

    const conta = this.data.conta;
    this.form.patchValue({
      numero: conta.numero,
      descricao: conta.descricao,
      clienteId: conta.clienteId,
      clienteNome: conta.clienteNome,
      vendedorId: conta.vendedorId,
      vendedorNome: conta.vendedorNome,
      valorOriginal: conta.valorOriginal,
      desconto: conta.desconto,
      dataEmissao: new Date(conta.dataEmissao),
      dataVencimento: new Date(conta.dataVencimento),
      observacoes: conta.observacoes,
      ehRecorrente: conta.ehRecorrente,
      tipoRecorrencia: conta.tipoRecorrencia
    });
  }

  /**
   * Submete o formulário
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSaving.set(true);

    if (this.data.isEdit) {
      this.updateConta();
    } else {
      this.createConta();
    }
  }

  // === MÉTODOS DE AUTOCOMPLETE ===

  /**
   * Função para exibir nome do cliente no input
   */
  displayClienteFn = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.nome || '';
  };

  /**
   * Função para exibir nome do vendedor no input
   */
  displayVendedorFn = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.name || '';
  };

  /**
   * Quando o usuário foca no campo de cliente
   */
  onClienteFocus(): void {
    const clienteNomeControl = this.form.get('clienteNome');
    const currentValue = clienteNomeControl?.value;

    // Se o campo está vazio, mostra todos os clientes ao focar
    if (!currentValue || currentValue.trim() === '') {
      this.clientesFiltrados.set(this.clientes());
    }
  }

  /**
   * Quando o usuário digita no campo de cliente
   */
  onClienteInput(event: any): void {
    const value = event.target.value;
    if (value && value.trim() !== '') {
      // Filtra conforme digita
      const clientes = this.filtrarClientes(value);
      this.clientesFiltrados.set(clientes);
    } else {
      // Se limpar o campo, mostra todos novamente
      this.clientesFiltrados.set(this.clientes());
    }
  }

  /**
   * Quando o usuário seleciona um cliente do autocomplete
   */
  onClienteOptionSelected(event: any): void {
    const cliente = event.option.value;
    if (cliente && typeof cliente === 'object') {
      this.form.patchValue({
        clienteId: cliente.id,
        clienteNome: cliente.nome
      });
    }
  }

  /**
   * Quando o usuário foca no campo de vendedor
   */
  onVendedorFocus(): void {
    const vendedorNomeControl = this.form.get('vendedorNome');
    const currentValue = vendedorNomeControl?.value;

    // Se o campo está vazio, mostra todos os vendedores ao focar
    if (!currentValue || currentValue.trim() === '') {
      this.vendedoresFiltrados.set(this.vendedores());
    }
  }

  /**
   * Quando o usuário digita no campo de vendedor
   */
  onVendedorInput(event: any): void {
    const value = event.target.value;
    if (value && value.trim() !== '') {
      // Filtra conforme digita
      const vendedores = this.filtrarVendedores(value);
      this.vendedoresFiltrados.set(vendedores);
    } else {
      // Se limpar o campo, mostra todos novamente
      this.vendedoresFiltrados.set(this.vendedores());
    }
  }

  /**
   * Quando o usuário seleciona um vendedor do autocomplete
   */
  onVendedorOptionSelected(event: any): void {
    const vendedor = event.option.value;
    if (vendedor && typeof vendedor === 'object') {
      this.form.patchValue({
        vendedorId: vendedor.id,
        vendedorNome: vendedor.name
      });
    }
  }

  /**
   * Filtra clientes baseado no texto digitado
   */
  private filtrarClientes(value: string): Cliente[] {
    if (!value || value.trim() === '') {
      return this.clientes();
    }
    const filterValue = value.toLowerCase();
    return this.clientes().filter(cliente =>
      cliente.nome.toLowerCase().includes(filterValue) ||
      cliente.email.toLowerCase().includes(filterValue)
    );
  }

  /**
   * Filtra vendedores baseado no texto digitado
   */
  private filtrarVendedores(value: string): User[] {
    if (!value || value.trim() === '') {
      return this.vendedores();
    }
    const filterValue = value.toLowerCase();
    return this.vendedores().filter(vendedor =>
      vendedor.name.toLowerCase().includes(filterValue) ||
      vendedor.email.toLowerCase().includes(filterValue)
    );
  }

  /**
   * Cria nova conta
   */
  private createConta(): void {
    const formValue = this.form.value;
    const contaData: CreateContaReceber = {
      descricao: formValue.descricao,
      clienteId: formValue.clienteId || undefined,
      clienteNome: formValue.clienteNome || undefined,
      valorOriginal: formValue.valorOriginal,
      desconto: formValue.desconto || 0,
      dataEmissao: formValue.dataEmissao.toISOString(),
      dataVencimento: formValue.dataVencimento.toISOString(),
      observacoes: formValue.observacoes || undefined,
      ehRecorrente: formValue.ehRecorrente,
      tipoRecorrencia: formValue.ehRecorrente ? formValue.tipoRecorrencia : undefined,
      vendedorId: formValue.vendedorId || undefined,
      vendedorNome: formValue.vendedorNome || undefined
    };

    this.contaReceberService.create(contaData).subscribe({
      next: (conta) => {
        this.showSnackBar('Conta criada com sucesso!', 'success');
        this.dialogRef.close(conta);
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Erro ao criar conta:', error);
        this.showSnackBar('Erro ao criar conta', 'error');
        this.isSaving.set(false);
      }
    });
  }

  /**
   * Atualiza conta existente
   */
  private updateConta(): void {
    if (!this.data.conta) return;

    const formValue = this.form.value;
    const contaData: UpdateContaReceber = {
      id: this.data.conta.id,
      descricao: formValue.descricao,
      clienteId: formValue.clienteId || undefined,
      clienteNome: formValue.clienteNome || undefined,
      valorOriginal: formValue.valorOriginal,
      desconto: formValue.desconto || 0,
      dataEmissao: formValue.dataEmissao.toISOString(),
      dataVencimento: formValue.dataVencimento.toISOString(),
      observacoes: formValue.observacoes || undefined,
      ehRecorrente: formValue.ehRecorrente,
      tipoRecorrencia: formValue.ehRecorrente ? formValue.tipoRecorrencia : undefined,
      vendedorId: formValue.vendedorId || undefined,
      vendedorNome: formValue.vendedorNome || undefined
    };

    this.contaReceberService.update(this.data.conta.id, contaData).subscribe({
      next: (conta) => {
        this.showSnackBar('Conta atualizada com sucesso!', 'success');
        this.dialogRef.close(conta);
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Erro ao atualizar conta:', error);
        this.showSnackBar('Erro ao atualizar conta', 'error');
        this.isSaving.set(false);
      }
    });
  }

  /**
   * Cancela e fecha o dialog
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Marca todos os campos como touched para mostrar erros
   */
  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtém mensagem de erro para um campo
   */
  getFieldErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    if (errors['required']) {
      const fieldLabels: { [key: string]: string } = {
        numero: 'Número',
        descricao: 'Descrição',
        valorOriginal: 'Valor',
        dataEmissao: 'Data de Emissão',
        dataVencimento: 'Data de Vencimento'
      };
      return `${fieldLabels[fieldName] || fieldName} é obrigatório`;
    }

    if (errors['minlength']) {
      return `Mínimo de ${errors['minlength'].requiredLength} caracteres`;
    }

    if (errors['min']) {
      return 'Valor deve ser maior que zero';
    }

    return 'Campo inválido';
  }

  /**
   * Verifica se um campo tem erro
   */
  hasFieldError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.errors && control.touched);
  }

  /**
   * Gera número automático
   */
  generateNumber(): void {
    const timestamp = new Date().getTime();
    const number = `REC-${timestamp.toString().slice(-6)}`;
    this.form.patchValue({ numero: number });
  }

  /**
   * Obtém título do dialog
   */
  getDialogTitle(): string {
    return this.data.isEdit ? 'Editar Conta a Receber' : 'Nova Conta a Receber';
  }

  /**
   * Obtém texto do botão de salvar
   */
  getSaveButtonText(): string {
    if (this.isSaving()) {
      return this.data.isEdit ? 'Atualizando...' : 'Criando...';
    }
    return this.data.isEdit ? 'Atualizar' : 'Criar';
  }

  /**
   * Controla exibição dos campos de recorrência
   */
  onRecorrenteChange(): void {
    const ehRecorrente = this.form.get('ehRecorrente')?.value;

    if (ehRecorrente) {
      this.form.get('tipoRecorrencia')?.setValidators([Validators.required]);
    } else {
      this.form.get('tipoRecorrencia')?.clearValidators();
      this.form.patchValue({
        tipoRecorrencia: undefined
      });
    }

    this.form.get('tipoRecorrencia')?.updateValueAndValidity();
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
