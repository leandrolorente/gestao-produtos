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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { Fornecedor, TipoFornecedor, StatusFornecedor } from '../../models/Fornecedor';
import { TipoEndereco } from '../../models/Endereco';
import { HttpClient } from '@angular/common/http';
import { CnpjCpfMaskDirective } from '../../directives/cnpj-cpf-mask.directive';
import { TelefoneMaskDirective } from '../../directives/telefone-mask.directive';
import { CepMaskDirective } from '../../directives/cep-mask.directive';
import { NumbersOnlyMaskDirective } from '../../directives/numbers-only-mask.directive';
import { UfMaskDirective } from '../../directives/uf-mask.directive';

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
    MatDividerModule,
    MatCheckboxModule,
    CnpjCpfMaskDirective,
    TelefoneMaskDirective,
    CepMaskDirective,
    NumbersOnlyMaskDirective,
    UfMaskDirective
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
      razaoSocial: [data?.razaoSocial || '', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(200)
      ]],
      nomeFantasia: [data?.nomeFantasia || '', [Validators.maxLength(200)]],
      cnpjCpf: [data?.cnpjCpf || '', [
        Validators.required,
        Validators.pattern(/^(\d{11}|\d{14}|\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/) // CPF/CNPJ formatado ou não
      ]],
      email: [data?.email || '', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]],
      telefone: [data?.telefone || '', [
        Validators.required,
        Validators.pattern(/^\(?([0-9]{2})\)?\s?([0-9]{4,5})-?([0-9]{4})$|^\d{10,11}$/) // Telefone formatado ou apenas números
      ]],
      inscricaoEstadual: [data?.inscricaoEstadual || '', [Validators.maxLength(20)]],
      inscricaoMunicipal: [data?.inscricaoMunicipal || '', [Validators.maxLength(20)]],
      tipo: [data?.tipo || TipoFornecedor.Nacional, Validators.required],
      status: [data?.status || StatusFornecedor.Ativo],
      contatoPrincipal: [data?.contatoPrincipal || '', [Validators.maxLength(100)]],
      site: [data?.site || '', [
        Validators.pattern(/^https?:\/\/.+\..+/) // URL válida
      ]],
      observacoes: [data?.observacoes || '', [Validators.maxLength(500)]]
    });

    // Form Endereço
    this.formEndereco = this.fb.group({
      tipo: [data?.endereco?.tipo || TipoEndereco.Comercial],
      cep: [data?.endereco?.cep || '', [
        Validators.pattern(/^\d{8}$|^\d{5}-\d{3}$/) // CEP: 8 dígitos ou formatado 00000-000
      ]],
      logradouro: [data?.endereco?.logradouro || '', [Validators.maxLength(200)]],
      numero: [data?.endereco?.numero || '', [Validators.maxLength(10)]],
      complemento: [data?.endereco?.complemento || '', [Validators.maxLength(100)]],
      unidade: [data?.endereco?.unidade || '', [Validators.maxLength(50)]],
      bairro: [data?.endereco?.bairro || '', [Validators.maxLength(100)]],
      localidade: [data?.endereco?.localidade || '', [Validators.maxLength(100)]],
      uf: [data?.endereco?.uf || '', [
        Validators.pattern(/^[A-Z]{2}$/), // UF: 2 letras maiúsculas
        Validators.maxLength(2)
      ]],
      estado: [data?.endereco?.estado || '', [Validators.maxLength(50)]],
      regiao: [data?.endereco?.regiao || '', [Validators.maxLength(50)]],
      referencia: [data?.endereco?.referencia || '', [Validators.maxLength(200)]],
      isPrincipal: [data?.endereco?.isPrincipal ?? true]
    });

    // Form Bancário
    this.formBancario = this.fb.group({
      banco: [data?.banco || '', [Validators.maxLength(100)]],
      agencia: [data?.agencia || '', [
        Validators.pattern(/^\d{4,5}$/) // Agência: 4 ou 5 dígitos
      ]],
      conta: [data?.conta || '', [
        Validators.pattern(/^\d{5,12}$/) // Conta: 5 a 12 dígitos
      ]],
      pix: [data?.pix || '', [Validators.maxLength(200)]]
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
        // CPF: 11 dígitos ou CNPJ: 14 dígitos
        cnpjControl?.setValidators([
          Validators.required,
          Validators.pattern(/^(\d{11}|\d{14})$/)
        ]);
      } else {
        // Internacional: qualquer documento
        cnpjControl?.setValidators([
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(20)
        ]);
      }
      cnpjControl?.updateValueAndValidity();
    });

    // No modo de edição
    if (this.isEditMode) {
      // Status é obrigatório
      this.formGeral.get('status')?.setValidators([Validators.required]);
      this.formGeral.get('status')?.updateValueAndValidity();

      // CNPJ/CPF não pode ser alterado
      this.formGeral.get('cnpjCpf')?.disable();
    }

    // Aplica máscaras aos valores iniciais
    this.applyInitialMasks();
  }

  /**
   * Aplica máscaras aos valores que já existem no formulário
   * As diretivas cuidam das máscaras em tempo real
   */
  private applyInitialMasks(): void {
    // As diretivas já aplicam as máscaras automaticamente
    // Esta função pode ser removida no futuro se não houver necessidade
    // de inicialização especial
  }  /**
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

    // Monta objeto fornecedor conforme CreateFornecedorDto ou UpdateFornecedorDto
    const fornecedor: any = {
      razaoSocial: this.formGeral.value.razaoSocial,
      nomeFantasia: this.formGeral.value.nomeFantasia || null,
      email: this.formGeral.value.email,
      telefone: this.formGeral.value.telefone,
      inscricaoEstadual: this.formGeral.value.inscricaoEstadual || null,
      inscricaoMunicipal: this.formGeral.value.inscricaoMunicipal || null,
      tipo: Number(this.formGeral.value.tipo) || TipoFornecedor.Nacional, // Padrão: Nacional
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

    // CNPJ/CPF: apenas para CREATE (não deve ser alterado em UPDATE)
    if (!this.isEditMode) {
      fornecedor.cnpjCpf = this.formGeral.value.cnpjCpf;
    }

    // Status: obrigatório para UPDATE, opcional para CREATE
    if (this.isEditMode) {
      fornecedor.status = Number(this.formGeral.value.status) || StatusFornecedor.Ativo; // Padrão: Ativo
    } else {
      fornecedor.status = this.formGeral.value.status ? Number(this.formGeral.value.status) : null;
    }

    // Adiciona endereço com campos obrigatórios preenchidos
    if (Object.keys(enderecoValue).length > 0) {
      fornecedor.endereco = {
        tipo: enderecoValue.tipo ? Number(enderecoValue.tipo) : TipoEndereco.Comercial,
        cep: enderecoValue.cep || "",
        logradouro: enderecoValue.logradouro || "",
        numero: enderecoValue.numero || "",
        complemento: enderecoValue.complemento || "",
        unidade: enderecoValue.unidade || "",
        bairro: enderecoValue.bairro || "",
        localidade: enderecoValue.localidade || "",
        uf: enderecoValue.uf || "",
        estado: enderecoValue.estado || "",
        regiao: enderecoValue.regiao || "Sudeste",
        referencia: enderecoValue.referencia || "",
        isPrincipal: enderecoValue.isPrincipal ?? true
      };
    }

    // Validações finais antes de enviar
    if (!fornecedor.tipo) {
      fornecedor.tipo = TipoFornecedor.Nacional; // Nacional por padrão
    }

    if (this.isEditMode && !fornecedor.status) {
      fornecedor.status = StatusFornecedor.Ativo; // Ativo por padrão
    }

    // Adiciona ID se estiver editando (para PUT)
    if (this.formGeral.value.id) {
      fornecedor.id = this.formGeral.value.id;
    }

    console.log(`✅ Payload ${this.isEditMode ? 'UPDATE' : 'CREATE'} sendo enviado:`, JSON.stringify(fornecedor, null, 2));
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
   * Formata URL
   */
  formatUrl(event: any): void {
    let value = event.target.value.trim();

    // Auto-adiciona https:// se não existir
    if (value && !value.match(/^https?:\/\//)) {
      value = 'https://' + value;
      event.target.value = value;
    }

    this.formGeral.get('site')?.setValue(value, { emitEvent: false });
  }  /**
   * Retorna mensagem de erro do campo melhorada
   */
  getFieldErrorMessage(fieldName: string, formGroup: FormGroup = this.formGeral): string {
    const control = formGroup.get(fieldName);

    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} é obrigatório`;
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('maxlength')) {
      return `Máximo ${control.errors?.['maxlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    if (control?.hasError('pattern')) {
      switch (fieldName) {
        case 'cnpjCpf':
          return 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos';
        case 'telefone':
          return 'Telefone deve ter 10 ou 11 dígitos';
        case 'cep':
          return 'CEP deve ter 8 dígitos';
        case 'uf':
          return 'UF deve ter 2 letras (ex: SP)';
        case 'agencia':
          return 'Agência deve ter 4 ou 5 dígitos';
        case 'conta':
          return 'Conta deve ter entre 5 e 12 dígitos';
        case 'site':
          return 'URL inválida (ex: https://exemplo.com)';
        default:
          return 'Formato inválido';
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
