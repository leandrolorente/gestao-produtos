import { Component, Inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { Fornecedor, TipoFornecedor, StatusFornecedor } from '../../models/Fornecedor';
import { TipoEndereco } from '../../models/Endereco';
import { HttpClient } from '@angular/common/http';

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

@Component({
  selector: 'app-fornecedor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatTabsModule,
    MatDividerModule
  ],
  templateUrl: './fornecedor-dialog.component.html',
  styleUrls: ['./fornecedor-dialog.component.scss']
})
export class FornecedorDialogComponent implements OnInit {
  formGeral: FormGroup;
  formEndereco: FormGroup;
  formBancario: FormGroup;
  formComercial: FormGroup;

  isEditMode: boolean;
  isLoadingCep = signal(false);

  // Arrays para selects
  tiposFornecedor = [
    { value: TipoFornecedor.Nacional, label: 'Nacional' },
    { value: TipoFornecedor.Internacional, label: 'Internacional' }
  ];

  statusFornecedor = [
    { value: StatusFornecedor.Ativo, label: 'Ativo' },
    { value: StatusFornecedor.Inativo, label: 'Inativo' },
    { value: StatusFornecedor.Bloqueado, label: 'Bloqueado' }
  ];

  tiposEndereco = [
    { value: TipoEndereco.Residencial, label: 'Residencial' },
    { value: TipoEndereco.Comercial, label: 'Comercial' },
    { value: TipoEndereco.Cobranca, label: 'Cobrança' },
    { value: TipoEndereco.Entrega, label: 'Entrega' },
    { value: TipoEndereco.Outro, label: 'Outro' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<FornecedorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Fornecedor | null
  ) {
    this.isEditMode = !!data?.id;

    // Form Dados Gerais
    this.formGeral = this.fb.group({
      id: [data?.id],
      razaoSocial: [data?.razaoSocial || '', [Validators.required, Validators.minLength(3)]],
      nomeFantasia: [data?.nomeFantasia || ''],
      cnpjCpf: [data?.cnpjCpf || '', [Validators.required]],
      email: [data?.email || '', [Validators.required, Validators.email]],
      telefone: [data?.telefone || '', [Validators.required]],
      inscricaoEstadual: [data?.inscricaoEstadual || ''],
      inscricaoMunicipal: [data?.inscricaoMunicipal || ''],
      tipo: [data?.tipo || TipoFornecedor.Nacional, Validators.required],
      status: [data?.status || StatusFornecedor.Ativo],
      contatoPrincipal: [data?.contatoPrincipal || ''],
      site: [data?.site || ''],
      observacoes: [data?.observacoes || '']
    });

    // Form Endereço
    this.formEndereco = this.fb.group({
      tipo: [data?.endereco?.tipo || TipoEndereco.Comercial],
      cep: [data?.endereco?.cep || ''],
      logradouro: [data?.endereco?.logradouro || ''],
      numero: [data?.endereco?.numero || ''],
      complemento: [data?.endereco?.complemento || ''],
      unidade: [data?.endereco?.unidade || ''],
      bairro: [data?.endereco?.bairro || ''],
      localidade: [data?.endereco?.localidade || ''],
      uf: [data?.endereco?.uf || ''],
      estado: [data?.endereco?.estado || ''],
      regiao: [data?.endereco?.regiao || ''],
      referencia: [data?.endereco?.referencia || ''],
      isPrincipal: [data?.endereco?.isPrincipal ?? true]
    });

    // Form Bancário
    this.formBancario = this.fb.group({
      banco: [data?.banco || ''],
      agencia: [data?.agencia || ''],
      conta: [data?.conta || ''],
      pix: [data?.pix || '']
    });

    // Form Comercial
    this.formComercial = this.fb.group({
      prazoPagamentoPadrao: [data?.prazoPagamentoPadrao || 0, [Validators.required, Validators.min(0)]],
      limiteCredito: [data?.limiteCredito || 0, [Validators.required, Validators.min(0)]],
      condicoesPagamento: [data?.condicoesPagamento || '']
    });
  }

  ngOnInit(): void {
    // Listener para mudança de tipo (Nacional/Internacional)
    this.formGeral.get('tipo')?.valueChanges.subscribe(tipo => {
      const cnpjControl = this.formGeral.get('cnpjCpf');
      if (tipo === TipoFornecedor.Nacional) {
        cnpjControl?.setValidators([Validators.required, Validators.pattern(/^\d{11}|\d{14}$/)]);
      } else {
        cnpjControl?.setValidators([Validators.required]);
      }
      cnpjControl?.updateValueAndValidity();
    });
  }

  /**
   * Busca endereço pelo CEP usando ViaCEP
   */
  buscarCep(): void {
    const cep = this.formEndereco.get('cep')?.value?.replace(/\D/g, '');

    if (!cep || cep.length !== 8) {
      return;
    }

    this.isLoadingCep.set(true);

    this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cep}/json/`)
      .subscribe({
        next: (data) => {
          if (data.erro) {
            alert('CEP não encontrado');
          } else {
            this.formEndereco.patchValue({
              logradouro: data.logradouro,
              bairro: data.bairro,
              localidade: data.localidade,
              uf: data.uf,
              estado: data.uf
            });
          }
          this.isLoadingCep.set(false);
        },
        error: (error) => {
          console.error('Erro ao buscar CEP:', error);
          alert('Erro ao buscar CEP');
          this.isLoadingCep.set(false);
        }
      });
  }

  /**
   * Salva todos os formulários
   */
  onSave(): void {
    // Marca todos os forms como touched
    this.markFormGroupTouched(this.formGeral);
    this.markFormGroupTouched(this.formEndereco);
    this.markFormGroupTouched(this.formBancario);
    this.markFormGroupTouched(this.formComercial);

    // Valida form principal
    if (!this.formGeral.valid) {
      console.warn('⚠️ Formulário Geral inválido');
      Object.keys(this.formGeral.controls).forEach(key => {
        const control = this.formGeral.get(key);
        if (control?.invalid) {
          console.warn(`Campo inválido: ${key}`, control.errors);
        }
      });
      return;
    }

    // Valida form comercial (campos obrigatórios)
    if (!this.formComercial.valid) {
      console.warn('⚠️ Formulário Comercial inválido');
      Object.keys(this.formComercial.controls).forEach(key => {
        const control = this.formComercial.get(key);
        if (control?.invalid) {
          console.warn(`Campo inválido: ${key}`, control.errors);
        }
      });
      alert('Por favor, preencha os campos obrigatórios na aba "Condições Comerciais"');
      return;
    }

    // Remove campos vazios do endereço
    const enderecoValue = { ...this.formEndereco.value };
    Object.keys(enderecoValue).forEach(key => {
      if (enderecoValue[key] === '' || enderecoValue[key] === null) {
        delete enderecoValue[key];
      }
    });

    // Monta objeto fornecedor conforme CreateFornecedorDto
    const fornecedor: any = {
      razaoSocial: this.formGeral.value.razaoSocial,
      nomeFantasia: this.formGeral.value.nomeFantasia || null,
      cnpjCpf: this.formGeral.value.cnpjCpf,
      email: this.formGeral.value.email,
      telefone: this.formGeral.value.telefone,
      inscricaoEstadual: this.formGeral.value.inscricaoEstadual || null,
      inscricaoMunicipal: this.formGeral.value.inscricaoMunicipal || null,
      tipo: Number(this.formGeral.value.tipo),
      status: this.formGeral.value.status ? Number(this.formGeral.value.status) : null,
      observacoes: this.formGeral.value.observacoes || null,
      contatoPrincipal: this.formGeral.value.contatoPrincipal || null,
      site: this.formGeral.value.site || null,
      banco: this.formBancario.value.banco || null,
      agencia: this.formBancario.value.agencia || null,
      conta: this.formBancario.value.conta || null,
      pix: this.formBancario.value.pix || null,
      prazoPagamentoPadrao: Number(this.formComercial.value.prazoPagamentoPadrao) || 0,
      limiteCredito: Number(this.formComercial.value.limiteCredito) || 0,
      condicoesPagamento: this.formComercial.value.condicoesPagamento || null
    };

    // Adiciona endereço apenas se houver dados
    if (Object.keys(enderecoValue).length > 0) {
      fornecedor.endereco = {
        ...enderecoValue,
        tipo: enderecoValue.tipo ? Number(enderecoValue.tipo) : TipoEndereco.Comercial
      };
    }

    // Adiciona ID se estiver editando (para PUT)
    if (this.formGeral.value.id) {
      fornecedor.id = this.formGeral.value.id;
    }

    console.log('✅ Payload válido sendo enviado:', JSON.stringify(fornecedor, null, 2));
    this.dialogRef.close(fornecedor);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Formata CNPJ/CPF durante digitação
   */
  formatCnpjCpf(event: any): void {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length <= 11) {
      // CPF: 000.000.000-00
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      // CNPJ: 00.000.000/0000-00
      value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    event.target.value = value;
    this.formGeral.get('cnpjCpf')?.setValue(value.replace(/\D/g, ''));
  }

  /**
   * Formata CEP durante digitação
   */
  formatCep(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{5})(\d{3})/, '$1-$2');
    event.target.value = value;
    this.formEndereco.get('cep')?.setValue(value.replace(/\D/g, ''));
  }

  /**
   * Formata telefone durante digitação
   */
  formatTelefone(event: any, fieldName: string): void {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length <= 10) {
      // (00) 0000-0000
      value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      // (00) 00000-0000
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    event.target.value = value;
    this.formGeral.get(fieldName)?.setValue(value.replace(/\D/g, ''));
  }

  /**
   * Retorna mensagem de erro do campo
   */
  getFieldErrorMessage(fieldName: string, formGroup: FormGroup = this.formGeral): string {
    const control = formGroup.get(fieldName);

    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} é obrigatório`;
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    if (control?.hasError('pattern')) {
      if (fieldName === 'cnpjCpf') {
        return 'CPF/CNPJ inválido';
      }
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nomeFantasia: 'Nome Fantasia',
      razaoSocial: 'Razão Social',
      cnpjCpf: 'CNPJ/CPF',
      tipo: 'Tipo',
      status: 'Status',
      contatoEmail: 'Email'
    };
    return labels[fieldName] || fieldName;
  }
}
