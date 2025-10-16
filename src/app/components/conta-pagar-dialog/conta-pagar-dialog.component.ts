import { Component, Inject, OnInit, signal } from '@angular/core';
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

import { ContaPagar, StatusContaPagar, FormaPagamento, CategoriaConta, TipoRecorrencia, ContaPagarCreateDTO, ContaPagarUpdateDTO } from '../../models/ContaPagar';
import { Fornecedor } from '../../models/Fornecedor';
import { ContaPagarService } from '../../services/conta-pagar.service';
import { FornecedorService } from '../../services/fornecedor.service';

export interface ContaPagarDialogData {
  conta?: ContaPagar;
  isEdit: boolean;
}

@Component({
  selector: 'app-conta-pagar-dialog',
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
  templateUrl: './conta-pagar-dialog.component.html',
  styleUrls: ['./conta-pagar-dialog.component.scss']
})
export class ContaPagarDialogComponent implements OnInit {
  form: FormGroup;
  isLoading = signal(false);
  isSaving = signal(false);

  // Signals para autocomplete de fornecedor
  fornecedores = signal<Fornecedor[]>([]);
  fornecedoresFiltrados = signal<Fornecedor[]>([]);
  fornecedorAutoCompleteOpen = signal<boolean>(false);

  // Enums para selects
  formasPagamento = [
    { value: FormaPagamento.Dinheiro, label: 'Dinheiro' },
    { value: FormaPagamento.PIX, label: 'PIX' },
    { value: FormaPagamento.CartaoDebito, label: 'Cartão de Débito' },
    { value: FormaPagamento.CartaoCredito, label: 'Cartão de Crédito' },
    { value: FormaPagamento.Transferencia, label: 'Transferência Bancária' },
    { value: FormaPagamento.Boleto, label: 'Boleto Bancário' },
    { value: FormaPagamento.Cheque, label: 'Cheque' }
  ];

  categorias = [
    { value: CategoriaConta.Fornecedores, label: 'Fornecedores' },
    { value: CategoriaConta.Impostos, label: 'Impostos' },
    { value: CategoriaConta.Funcionarios, label: 'Funcionários' },
    { value: CategoriaConta.Aluguel, label: 'Aluguel' },
    { value: CategoriaConta.Energia, label: 'Energia' },
    { value: CategoriaConta.Telefone, label: 'Telefone' },
    { value: CategoriaConta.Internet, label: 'Internet' },
    { value: CategoriaConta.Marketing, label: 'Marketing' },
    { value: CategoriaConta.Manutencao, label: 'Manutenção' },
    { value: CategoriaConta.Combustivel, label: 'Combustível' },
    { value: CategoriaConta.Outros, label: 'Outros' }
  ];

  tiposRecorrencia = [
    { value: TipoRecorrencia.Semanal, label: 'Semanal' },
    { value: TipoRecorrencia.Quinzenal, label: 'Quinzenal' },
    { value: TipoRecorrencia.Mensal, label: 'Mensal' },
    { value: TipoRecorrencia.Bimestral, label: 'Bimestral' },
    { value: TipoRecorrencia.Trimestral, label: 'Trimestral' },
    { value: TipoRecorrencia.Anual, label: 'Anual' }
  ];

  constructor(
    private fb: FormBuilder,
    private contaPagarService: ContaPagarService,
    private fornecedorService: FornecedorService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ContaPagarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ContaPagarDialogData
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    console.log('Dialog dados recebidos:', this.data);
    
    // Primeiro carrega os fornecedores
    this.loadFornecedores();

    // Depois carrega os dados da conta se for edição
    if (this.data.isEdit && this.data.conta) {
      console.log('Modo edição - conta:', this.data.conta);
      // Aguarda um tick para garantir que os fornecedores foram carregados
      setTimeout(() => {
        this.loadContaData();
      }, 100);
    } else {
      console.log('Modo criação');
    }
  }

  /**
   * Cria o formulário
   */
  private createForm(): FormGroup {
    return this.fb.group({
      numero: ['', Validators.required],
      descricao: ['', [Validators.required, Validators.minLength(3)]],
      fornecedorId: [null, Validators.required],
      fornecedorNome: ['', Validators.required],
      compraId: [null], // Campo opcional para compra relacionada
      notaFiscal: [''], // Campo para nota fiscal
      valorOriginal: [0, [Validators.required, Validators.min(0.01)]],
      desconto: [0, [Validators.min(0)]], // Campo desconto
      dataEmissao: [new Date(), Validators.required],
      dataVencimento: [null, Validators.required],
      formaPagamento: [FormaPagamento.PIX, Validators.required],
      categoria: [CategoriaConta.Outros, Validators.required],
      observacoes: [''],
      centroCusto: [''], // Campo centro de custo
      recorrente: [false],
      tipoRecorrencia: [null],
      diasRecorrencia: [null], // Campo para dias de recorrência personalizada
      quantidadeParcelas: [1],
      contaBancariaId: [null]
    });
  }

  /**
   * Carrega dados da conta para edição
   */
  private loadContaData(): void {
    if (!this.data.conta) return;

    const conta = this.data.conta;
    console.log('Carregando dados da conta para edição:', conta);
    
    // Criar objeto com valores padrão para campos que podem não existir
    const formValues = {
      numero: conta.numero || '',
      descricao: conta.descricao || '',
      fornecedorId: conta.fornecedorId || null,
      fornecedorNome: conta.fornecedorNome || '',
      compraId: conta.compraId || null,
      notaFiscal: conta.notaFiscal || '',
      valorOriginal: conta.valorOriginal || 0,
      desconto: conta.desconto || 0,
      dataEmissao: conta.dataEmissao ? new Date(conta.dataEmissao) : new Date(),
      dataVencimento: conta.dataVencimento ? new Date(conta.dataVencimento) : null,
      formaPagamento: this.convertToNumber(conta.formaPagamento) || FormaPagamento.PIX,
      categoria: this.convertToNumber(conta.categoria) || CategoriaConta.Outros, // Converter para número
      observacoes: conta.observacoes || '',
      centroCusto: conta.centroCusto || '',
      recorrente: Boolean(conta.ehRecorrente), // Garantir boolean
      tipoRecorrencia: conta.tipoRecorrencia ? this.convertToNumber(conta.tipoRecorrencia) : null, // Converter para número
      diasRecorrencia: conta.diasRecorrencia || null
    };

    console.log('Categoria da conta:', conta.categoria, 'Tipo:', typeof conta.categoria);
    console.log('Tipo recorrência da conta:', conta.tipoRecorrencia, 'Tipo:', typeof conta.tipoRecorrencia);
    console.log('É recorrente:', conta.ehRecorrente, 'Tipo:', typeof conta.ehRecorrente);

    console.log('Valores que serão carregados no formulário:', formValues);
    
    // Log específico para campos problemáticos
    console.log('Verificando categoria:');
    console.log('- Valor da API:', conta.categoria, '(tipo:', typeof conta.categoria, ')');
    console.log('- Valor no form:', formValues.categoria, '(tipo:', typeof formValues.categoria, ')');
    console.log('- Categorias disponíveis:', this.categorias);
    
    console.log('Verificando recorrência:');
    console.log('- ehRecorrente API:', conta.ehRecorrente, '(tipo:', typeof conta.ehRecorrente, ')');
    console.log('- recorrente form:', formValues.recorrente, '(tipo:', typeof formValues.recorrente, ')');
    
    console.log('Verificando tipo recorrência:');
    console.log('- Valor da API:', conta.tipoRecorrencia, '(tipo:', typeof conta.tipoRecorrencia, ')');
    console.log('- Valor no form:', formValues.tipoRecorrencia, '(tipo:', typeof formValues.tipoRecorrencia, ')');
    console.log('- Tipos disponíveis:', this.tiposRecorrencia);
    
    this.form.patchValue(formValues);

    console.log('Formulário após carregamento:', this.form.value);

    // Se há fornecedorId mas não há fornecedorNome, buscar o nome do fornecedor
    if (conta.fornecedorId && !conta.fornecedorNome) {
      const fornecedor = this.fornecedores().find(f => f.id === conta.fornecedorId);
      if (fornecedor) {
        this.form.patchValue({
          fornecedorNome: fornecedor.razaoSocial
        });
        console.log('Nome do fornecedor atualizado:', fornecedor.razaoSocial);
      }
    }
  }

  /**
   * Converte valor para número
   */
  private convertToNumber(value: any): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      return isNaN(num) ? null : num;
    }
    return null;
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

  /**
   * Cria nova conta
   */
  private createConta(): void {
    const formValue = this.form.value;
    const contaData: ContaPagarCreateDTO = {
      descricao: formValue.descricao,
      fornecedorId: formValue.fornecedorId,
      fornecedorNome: formValue.fornecedorNome,
      compraId: formValue.compraId || undefined,
      notaFiscal: formValue.notaFiscal || undefined,
      valorOriginal: formValue.valorOriginal,
      desconto: formValue.desconto || 0,
      dataEmissao: formValue.dataEmissao.toISOString(),
      dataVencimento: formValue.dataVencimento.toISOString(),
      categoria: formValue.categoria,
      observacoes: formValue.observacoes || '',
      centroCusto: formValue.centroCusto || undefined,
      ehRecorrente: formValue.recorrente || false,
      tipoRecorrencia: formValue.recorrente ? formValue.tipoRecorrencia : undefined,
      diasRecorrencia: formValue.recorrente && formValue.diasRecorrencia ? formValue.diasRecorrencia : undefined
    };

    this.contaPagarService.create(contaData).subscribe({
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
    const contaData: ContaPagarUpdateDTO = {
      id: this.data.conta.id,
      descricao: formValue.descricao,
      fornecedorId: formValue.fornecedorId,
      fornecedorNome: formValue.fornecedorNome,
      compraId: formValue.compraId || undefined,
      notaFiscal: formValue.notaFiscal || undefined,
      valorOriginal: formValue.valorOriginal,
      desconto: formValue.desconto || 0,
      dataEmissao: formValue.dataEmissao.toISOString(),
      dataVencimento: formValue.dataVencimento.toISOString(),
      categoria: formValue.categoria,
      observacoes: formValue.observacoes || '',
      centroCusto: formValue.centroCusto || undefined,
      ehRecorrente: formValue.recorrente || false,
      tipoRecorrencia: formValue.recorrente ? formValue.tipoRecorrencia : undefined,
      diasRecorrencia: formValue.recorrente && formValue.diasRecorrencia ? formValue.diasRecorrencia : undefined
    };

    this.contaPagarService.update(this.data.conta.id, contaData).subscribe({
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
        desconto: 'Desconto',
        dataEmissao: 'Data de Emissão',
        dataVencimento: 'Data de Vencimento',
        formaPagamento: 'Forma de Pagamento',
        categoria: 'Categoria',
        fornecedorId: 'Fornecedor',
        fornecedorNome: 'Nome do Fornecedor',
        notaFiscal: 'Nota Fiscal',
        centroCusto: 'Centro de Custo',
        tipoRecorrencia: 'Tipo de Recorrência',
        diasRecorrencia: 'Dias de Recorrência',
        quantidadeParcelas: 'Quantidade de Parcelas'
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
    const number = `PAG-${timestamp.toString().slice(-6)}`;
    this.form.patchValue({ numero: number });
  }

  /**
   * Obtém título do dialog
   */
  getDialogTitle(): string {
    return this.data.isEdit ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar';
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
   * Carrega fornecedores
   */
  private loadFornecedores(): void {
    this.fornecedorService.getAll().subscribe({
      next: (fornecedores: Fornecedor[]) => {
        this.fornecedores.set(fornecedores);
        this.fornecedoresFiltrados.set(fornecedores);
      },
      error: (error: any) => {
        console.error('Erro ao carregar fornecedores:', error);
        this.showSnackBar('Erro ao carregar fornecedores', 'error');
      }
    });
  }

  /**
   * Filtra fornecedores para autocomplete
   */
  private filtrarFornecedores(value: string): Fornecedor[] {
    if (!value || value.trim() === '') {
      return this.fornecedores();
    }
    const filterValue = value.toLowerCase();
    return this.fornecedores().filter(fornecedor =>
      fornecedor.razaoSocial.toLowerCase().includes(filterValue) ||
      (fornecedor.nomeFantasia && fornecedor.nomeFantasia.toLowerCase().includes(filterValue)) ||
      fornecedor.cnpjCpf.includes(filterValue)
    );
  }

  /**
   * Exibe fornecedor no campo
   */
  displayFornecedorFn = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.razaoSocial) {
      return `${value.razaoSocial}${value.nomeFantasia ? ' (' + value.nomeFantasia + ')' : ''}`;
    }
    return '';
  };

  /**
   * Eventos do autocomplete de fornecedor
   */
  onFornecedorFocus(): void {
    const fornecedorNomeControl = this.form.get('fornecedorNome');
    const currentValue = fornecedorNomeControl?.value;

    // Se o campo está vazio, mostra todos os fornecedores ao focar
    if (!currentValue || currentValue.trim() === '') {
      this.fornecedoresFiltrados.set(this.fornecedores());
    }
  }

  onFornecedorInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    if (value && value.trim() !== '') {
      // Filtra conforme digita
      const filteredFornecedores = this.filtrarFornecedores(value);
      this.fornecedoresFiltrados.set(filteredFornecedores);
    } else {
      // Se limpar o campo, mostra todos novamente
      this.fornecedoresFiltrados.set(this.fornecedores());
      // Limpa o ID se o campo for esvaziado
      this.form.patchValue({
        fornecedorId: null
      });
    }
  }

  onFornecedorOptionSelected(event: any): void {
    const fornecedor = event.option.value;
    console.log('Fornecedor selecionado via option:', fornecedor);
    if (fornecedor && typeof fornecedor === 'object') {
      this.form.patchValue({
        fornecedorId: fornecedor.id,
        fornecedorNome: fornecedor.razaoSocial
      });
    }
  }

  onFornecedorAutocompleteOpened(): void {
    this.fornecedorAutoCompleteOpen.set(true);
  }

  onFornecedorAutocompleteClosed(): void {
    this.fornecedorAutoCompleteOpen.set(false);

    // Validar se o fornecedor selecionado é válido
    const fornecedorNome = this.form.get('fornecedorNome')?.value;
    const fornecedorId = this.form.get('fornecedorId')?.value;
    
    if (fornecedorNome && !fornecedorId) {
      // Buscar fornecedor que corresponde ao nome digitado
      const fornecedorEncontrado = this.fornecedores().find(f =>
        f.razaoSocial?.toLowerCase() === fornecedorNome.toLowerCase() ||
        this.displayFornecedorFn(f).toLowerCase() === fornecedorNome.toLowerCase()
      );

      if (fornecedorEncontrado) {
        // Se encontrou, atualiza o ID
        this.form.patchValue({
          fornecedorId: fornecedorEncontrado.id,
          fornecedorNome: fornecedorEncontrado.razaoSocial
        });
      } else {
        // Se não encontrou, limpa os campos
        this.form.patchValue({
          fornecedorId: null,
          fornecedorNome: ''
        });
        this.showSnackBar('Por favor, selecione um fornecedor válido da lista', 'warning');
      }
    }
  }

  /**
   * Controla exibição dos campos de recorrência
   */
  onRecorrenteChange(): void {
    const recorrente = this.form.get('recorrente')?.value;

    if (recorrente) {
      this.form.get('tipoRecorrencia')?.setValidators([Validators.required]);
      this.form.get('quantidadeParcelas')?.setValidators([Validators.required, Validators.min(1)]);
    } else {
      this.form.get('tipoRecorrencia')?.clearValidators();
      this.form.get('quantidadeParcelas')?.clearValidators();
      this.form.patchValue({
        tipoRecorrencia: null,
        quantidadeParcelas: 1
      });
    }

    this.form.get('tipoRecorrencia')?.updateValueAndValidity();
    this.form.get('quantidadeParcelas')?.updateValueAndValidity();
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
