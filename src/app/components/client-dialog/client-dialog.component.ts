import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Cliente } from '../../models/Cliente';
import { ViaCepService } from '../../services/viacep.service';
import { ViaCepResponse } from '../../models/ViaCep';

export interface ClientDialogData {
  cliente: Cliente | null;
  isEdit: boolean;
}

@Component({
  selector: 'app-client-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './client-dialog.component.html',
  styleUrl: './client-dialog.component.scss'
})
export class ClientDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ClientDialogComponent>);
  private data = inject<ClientDialogData>(MAT_DIALOG_DATA);
  private viaCepService = inject(ViaCepService);
  private snackBar = inject(MatSnackBar);

  protected clienteForm: FormGroup;
  protected isEdit: boolean;
  protected buscandoCep = signal(false);

  protected readonly estados = [
    { sigla: 'AC', nome: 'Acre' },
    { sigla: 'AL', nome: 'Alagoas' },
    { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' },
    { sigla: 'BA', nome: 'Bahia' },
    { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' },
    { sigla: 'ES', nome: 'Espírito Santo' },
    { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' },
    { sigla: 'MT', nome: 'Mato Grosso' },
    { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' },
    { sigla: 'PA', nome: 'Pará' },
    { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' },
    { sigla: 'PE', nome: 'Pernambuco' },
    { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
    { sigla: 'RN', nome: 'Rio Grande do Norte' },
    { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' },
    { sigla: 'RR', nome: 'Roraima' },
    { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' },
    { sigla: 'SE', nome: 'Sergipe' },
    { sigla: 'TO', nome: 'Tocantins' }
  ];

  constructor() {
    this.isEdit = this.data.isEdit;
    this.clienteForm = this.createForm();

    if (this.data.cliente) {
      // Adapta os dados do cliente para o formulário flat
      const clienteFlat = {
        ...this.data.cliente,
        // Extrai campos do endereço para o nível raiz do formulário
        cep: this.data.cliente.endereco?.cep || '',
        logradouro: this.data.cliente.endereco?.logradouro || '',
        numero: this.data.cliente.endereco?.numero || '',
        complemento: this.data.cliente.endereco?.complemento || '',
        bairro: this.data.cliente.endereco?.bairro || '',
        localidade: this.data.cliente.endereco?.localidade || '',
        uf: this.data.cliente.endereco?.uf || '',
        estado: this.data.cliente.endereco?.estado || ''
      };
      this.clienteForm.patchValue(clienteFlat);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(99)]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required]],
      cpfCnpj: ['', [Validators.required]],
      // Campos de endereço atualizados
      cep: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      logradouro: ['', [Validators.required]],
      numero: ['', [Validators.required]],
      complemento: [''],
      bairro: ['', [Validators.required]],
      localidade: ['', [Validators.required]], // cidade
      uf: ['', [Validators.required]], // sigla do estado
      estado: ['', [Validators.required]], // nome completo do estado
      tipo: ['Pessoa Física', [Validators.required]],
      ativo: [true],
      observacoes: ['']
    });
  }

  protected getFieldErrorMessage(fieldName: string): string {
    const field = this.clienteForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Este campo é obrigatório';
    }
    if (field?.hasError('email')) {
      return 'Digite um email válido';
    }
    if (field?.hasError('pattern')) {
      if (fieldName === 'cep') {
        return 'CEP deve ter o formato 00000-000';
      }
      return 'Formato inválido';
    }
    if (field?.hasError('minlength')) {
      const requiredLength = field.errors?.['minlength']?.requiredLength;
      return `Mínimo de ${requiredLength} caracteres`;
    }
    if (field?.hasError('maxlength')) {
      const requiredLength = field.errors?.['maxlength']?.requiredLength;
      return `Máximo de ${requiredLength} caracteres`;
    }
    return '';
  }

  protected onSave(): void {
    if (this.clienteForm.valid) {
      const formValue = this.clienteForm.value;
      
      // Prepara os dados no formato esperado pelo serviço
      const clienteData = {
        id: this.data.cliente?.id, // Preserva o ID se for edição
        nome: formValue.nome,
        email: formValue.email,
        telefone: formValue.telefone,
        cpfCnpj: formValue.cpfCnpj,
        // Campos do endereço (flat no formulário, mas serão convertidos pelo service)
        cep: formValue.cep,
        logradouro: formValue.logradouro,
        numero: formValue.numero,
        complemento: formValue.complemento,
        bairro: formValue.bairro,
        localidade: formValue.localidade,
        uf: formValue.uf,
        estado: formValue.estado,
        tipo: formValue.tipo,
        ativo: formValue.ativo,
        observacoes: formValue.observacoes
      };

      this.dialogRef.close(clienteData);
    } else {
      Object.keys(this.clienteForm.controls).forEach(key => {
        const control = this.clienteForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  protected onCancel(): void {
    this.dialogRef.close();
  }

  protected formatCpfCnpj(event: any): void {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length <= 11) {
      // CPF: 000.000.000-00
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      this.clienteForm.patchValue({ tipo: 'Pessoa Física' });
    } else {
      // CNPJ: 00.000.000/0000-00
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
      this.clienteForm.patchValue({ tipo: 'Pessoa Jurídica' });
    }

    event.target.value = value;
    this.clienteForm.patchValue({ cpfCnpj: value });
  }

  protected formatTelefone(event: any): void {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length <= 10) {
      // (00) 0000-0000
      value = value.replace(/(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      // (00) 00000-0000
      value = value.replace(/(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{5})(\d)/, '$1-$2');
    }

    event.target.value = value;
  }

  protected formatCep(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    event.target.value = value;

    // Se o CEP estiver completo, buscar dados automaticamente
    if (value.length === 9) {
      this.buscarDadosCep(value);
    }
  }

  /**
   * Busca dados do CEP e preenche os campos automaticamente
   */
  protected async buscarDadosCep(cep?: string): Promise<void> {
    const cepValue = cep || this.clienteForm.get('cep')?.value;

    if (!cepValue || cepValue.length !== 9) {
      this.showError('Digite um CEP válido com 8 dígitos');
      return;
    }

    this.buscandoCep.set(true);

    try {
      // Primeiro valida o CEP
      const validacao = await this.viaCepService.validarCep(cepValue).toPromise();

      if (!validacao?.valido) {
        this.showError(validacao?.message || 'CEP inválido');
        this.buscandoCep.set(false);
        return;
      }

      // Se válido, busca os dados
      const dadosCep = await this.viaCepService.buscarCep(cepValue).toPromise();

      if (dadosCep) {
        this.preencherDadosEndereco(dadosCep);
        this.showSuccess('Endereço encontrado e preenchido automaticamente!');
      }
    } catch (error: any) {
      this.showError(error.message || 'Erro ao buscar CEP. Verifique o CEP digitado.');
    } finally {
      this.buscandoCep.set(false);
    }
  }

  /**
   * Preenche os campos de endereço com os dados do CEP
   */
  private preencherDadosEndereco(dados: ViaCepResponse): void {
    this.clienteForm.patchValue({
      cep: this.viaCepService.formatarCep(dados.cep),
      logradouro: dados.logradouro,
      complemento: dados.complemento,
      bairro: dados.bairro,
      localidade: dados.localidade,
      uf: dados.uf,
      estado: dados.estado
    });
  }

  /**
   * Exibe mensagem de sucesso
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['snackbar-success']
    });
  }

  /**
   * Exibe mensagem de erro
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
      panelClass: ['snackbar-error']
    });
  }
}
