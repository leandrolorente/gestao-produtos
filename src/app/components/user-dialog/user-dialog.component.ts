import { Component, Inject, signal } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { User } from '../../models/User';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.scss']
})
export class UserDialogComponent {
  form: FormGroup;
  isEditMode: boolean;
  hidePassword = true;
  showPasswordField = false;
  isSubmitting = signal(false);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User | null
  ) {
    this.isEditMode = !!data?.id;
    this.form = this.createForm();
  }

  private createForm(): FormGroup {
    const passwordValidators = this.isEditMode ? [] : [Validators.required, Validators.minLength(6)];

    return this.fb.group({
      id: [this.data?.id],
      name: [this.data?.name || '', [Validators.required, Validators.minLength(3)]],
      email: [this.data?.email || '', [Validators.required, Validators.email]],
      password: ['', passwordValidators],
      avatar: [this.data?.avatar || 'https://i.pravatar.cc/150?u=default', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      department: [this.data?.department || '', [Validators.required]],
    });
  }

  onSubmit(): void {
    console.log('Form status:', this.form.status);
    console.log('Form errors:', this.form.errors);
    console.log('Form values:', this.form.value);
    
    // Debug individual fields
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control?.invalid) {
        console.log(`Field ${key} is invalid:`, control.errors);
      }
    });

    if (this.form.valid) {
      this.isSubmitting.set(true);

      const formValue = { ...this.form.value };

      // Remove password se estiver vazia no modo de edição
      if (this.isEditMode && !formValue.password) {
        delete formValue.password;
      }

      // Simula delay da API
      setTimeout(() => {
        this.isSubmitting.set(false);
        this.dialogRef.close(formValue);
      }, 1000);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAvatarError(event: any): void {
    event.target.classList.add('error');
    console.warn('Erro ao carregar avatar:', event.target.src);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  getFieldErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);

    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} é obrigatório`;
    }

    if (control?.hasError('minlength')) {
      const requiredLength = control.errors?.['minlength']?.requiredLength;
      return `${this.getFieldLabel(fieldName)} deve ter pelo menos ${requiredLength} caracteres`;
    }

    if (control?.hasError('email')) {
      return 'Por favor, insira um e-mail válido';
    }

    if (control?.hasError('pattern')) {
      if (fieldName === 'avatar') {
        return 'Por favor, insira uma URL válida (http:// ou https://)';
      }
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Nome',
      email: 'E-mail',
      password: 'Senha',
      avatar: 'Avatar',
      department: 'Departamento'
    };
    return labels[fieldName] || fieldName;
  }

  // Getter para debug - mostra quais campos estão inválidos
  get invalidFields(): string[] {
    const invalid: string[] = [];
    Object.keys(this.form.controls).forEach(key => {
      if (this.form.get(key)?.invalid) {
        invalid.push(key);
      }
    });
    return invalid;
  }

  // Getter para facilitar debug no template
  get formDebugInfo(): any {
    return {
      valid: this.form.valid,
      invalid: this.form.invalid,
      invalidFields: this.invalidFields,
      values: this.form.value
    };
  }
}
