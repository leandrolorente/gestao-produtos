// src/app/components/product-dialog/product-dialog.component.ts
import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/Product';
import { BarcodeScannerComponent } from '../barcode-scanner/barcode-scanner.component';

@Component({
  selector: 'app-product-dialog',
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
  ],
  templateUrl: './product-dialog.component.html',
  styleUrls: ['./product-dialog.component.scss']
})
export class ProductDialogComponent {
  form: FormGroup;
  isEditMode: boolean;
  private dialog = inject(MatDialog);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Product | null
  ) {
    this.isEditMode = !!data?.id;
    this.form = this.fb.group({
      id: [data?.id],
      name: [
        data?.name || '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(100)]
      ],
      sku: [
        data?.sku || '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(20)]
      ],
      barcode: [
        data?.barcode || '',
        [Validators.pattern(/^[0-9]{8,20}$/), Validators.maxLength(50)]
      ],
      quantity: [data?.quantity ?? '', [Validators.required, Validators.min(0)]],
      price: [data?.price ?? '', [Validators.required, Validators.min(0.01)]],
    });
  }

  onSave(): void {
    if (this.form.valid) {
      const formValue = { ...this.form.value };
      formValue.quantity = Number(formValue.quantity);
      formValue.price = Number(formValue.price);
      this.dialogRef.close(formValue);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  formatPrice(event: any): void {
    let value = event.target.value;
    value = value.replace(/[^0-9.,]/g, '');
    value = value.replace(',', '.');
    event.target.value = value;
    this.form.get('price')?.setValue(value);
  }

  formatQuantity(event: any): void {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '');
    event.target.value = value;
    this.form.get('quantity')?.setValue(value);
  }

  openBarcodeScanner(): void {
    const dialogRef = this.dialog.open(BarcodeScannerComponent, {
      width: '500px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { initialCode: this.form.get('barcode')?.value || '' },
      disableClose: false,
      hasBackdrop: true,
      backdropClass: 'barcode-scanner-backdrop'
    });

    dialogRef.afterClosed().subscribe((barcode: string) => {
      if (barcode) {
        this.form.get('barcode')?.setValue(barcode);
        this.form.get('barcode')?.markAsTouched();
      }
    });
  }

  getFieldErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} é obrigatório`;
    }
    if (control?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} deve ter pelo menos ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('maxlength')) {
      return `${this.getFieldLabel(fieldName)} deve ter no máximo ${control.errors?.['maxlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} deve ser maior que ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('pattern')) {
      if (fieldName === 'barcode') {
        return 'Código de barras deve conter apenas números (8-20 dígitos)';
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Nome',
      sku: 'SKU',
      barcode: 'Código de Barras',
      quantity: 'Quantidade',
      price: 'Preço'
    };
    return labels[fieldName] || fieldName;
  }
}
