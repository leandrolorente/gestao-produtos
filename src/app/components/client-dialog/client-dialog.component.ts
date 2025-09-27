import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Cliente } from '../../models/Cliente';

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
    MatCheckboxModule
  ],
  templateUrl: './client-dialog.component.html',
  styleUrl: './client-dialog.component.scss'
})
export class ClientDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ClientDialogComponent>);
  private data = inject<ClientDialogData>(MAT_DIALOG_DATA);

  protected clienteForm: FormGroup;
  protected isEdit: boolean;

  protected readonly estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  constructor() {
    this.isEdit = this.data.isEdit;
    this.clienteForm = this.createForm();
    
    if (this.data.cliente) {
      this.clienteForm.patchValue(this.data.cliente);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required]],
      cpfCnpj: ['', [Validators.required]],
      endereco: ['', [Validators.required]],
      cidade: ['', [Validators.required]],
      estado: ['', [Validators.required]],
      cep: ['', [Validators.required]],
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
    if (field?.hasError('minlength')) {
      const requiredLength = field.errors?.['minlength']?.requiredLength;
      return `Mínimo de ${requiredLength} caracteres`;
    }
    return '';
  }

  protected onSave(): void {
    if (this.clienteForm.valid) {
      this.dialogRef.close(this.clienteForm.value);
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
  }
}
