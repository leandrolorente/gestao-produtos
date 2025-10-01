import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  icon?: string;
  iconColor?: 'primary' | 'accent' | 'warn';
  buttons: ConfirmationButton[];
  maxWidth?: string;
}

export interface ConfirmationButton {
  text: string;
  value: any;
  color?: 'primary' | 'accent' | 'warn' | '';
  variant?: 'basic' | 'raised' | 'stroked' | 'flat';
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {
    // Define valores padrão
    this.data = {
      icon: 'help',
      iconColor: 'primary',
      maxWidth: '400px',
      ...data
    };
  }

  onButtonClick(value: any): void {
    this.dialogRef.close(value);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}