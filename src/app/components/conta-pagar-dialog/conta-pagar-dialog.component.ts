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
import { ContaPagarService } from '../../services/conta-pagar.service';

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
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ContaPagarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ContaPagarDialogData
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.conta) {
      this.loadContaData();
    }
  }

  /**
   * Cria o formulário
   */
  private createForm(): FormGroup {
    return this.fb.group({
      numero: ['', Validators.required],
      descricao: ['', [Validators.required, Validators.minLength(3)]],
      fornecedorId: [null],
      fornecedorNome: [''],
      valorOriginal: [0, [Validators.required, Validators.min(0.01)]],
      dataEmissao: [new Date(), Validators.required],
      dataVencimento: [null, Validators.required],
      formaPagamento: [FormaPagamento.PIX, Validators.required],
      categoria: [CategoriaConta.Outros, Validators.required],
      observacoes: [''],
      recorrente: [false],
      tipoRecorrencia: [null],
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
    this.form.patchValue({
      numero: conta.numero,
      descricao: conta.descricao,
      fornecedorId: conta.fornecedorId,
      fornecedorNome: conta.fornecedorNome,
      valorOriginal: conta.valorOriginal,
      dataEmissao: new Date(conta.dataEmissao),
      dataVencimento: new Date(conta.dataVencimento),
      formaPagamento: conta.formaPagamento,
      categoria: conta.categoria,
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

  /**
   * Cria nova conta
   */
  private createConta(): void {
    const formValue = this.form.value;
    const contaData: ContaPagarCreateDTO = {
      descricao: formValue.descricao,
      fornecedorId: formValue.fornecedorId,
      fornecedorNome: formValue.fornecedorNome,
      valorOriginal: formValue.valorOriginal,
      desconto: 0,
      dataEmissao: formValue.dataEmissao.toISOString(),
      dataVencimento: formValue.dataVencimento.toISOString(),
      categoria: formValue.categoria,
      observacoes: formValue.observacoes || '',
      ehRecorrente: formValue.recorrente,
      tipoRecorrencia: formValue.recorrente ? formValue.tipoRecorrencia : undefined
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
      valorOriginal: formValue.valorOriginal,
      desconto: 0,
      dataEmissao: formValue.dataEmissao.toISOString(),
      dataVencimento: formValue.dataVencimento.toISOString(),
      categoria: formValue.categoria,
      observacoes: formValue.observacoes || '',
      ehRecorrente: formValue.recorrente,
      tipoRecorrencia: formValue.recorrente ? formValue.tipoRecorrencia : undefined
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
        dataEmissao: 'Data de Emissão',
        dataVencimento: 'Data de Vencimento',
        formaPagamento: 'Forma de Pagamento',
        categoria: 'Categoria'
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
