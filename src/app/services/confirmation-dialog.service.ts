import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
  ConfirmationButton
} from '../components/confirmation-dialog/confirmation-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  constructor(private dialog: MatDialog) {}

  /**
   * Abre um diálogo de confirmação personalizado
   */
  openConfirmationDialog(data: ConfirmationDialogData): Observable<any> {
    const dialogRef: MatDialogRef<ConfirmationDialogComponent> = this.dialog.open(
      ConfirmationDialogComponent,
      {
        width: data.maxWidth || '400px',
        disableClose: true,
        panelClass: 'confirmation-dialog-container',
        data: data
      }
    );

    return dialogRef.afterClosed();
  }

  /**
   * Método de conveniência para confirmação simples Sim/Não
   */
  confirm(
    title: string,
    message: string,
    options?: {
      icon?: string;
      iconColor?: 'primary' | 'accent' | 'warn';
      yesText?: string;
      noText?: string;
      maxWidth?: string;
    }
  ): Observable<boolean> {
    const buttons: ConfirmationButton[] = [
      {
        text: options?.noText || 'Não',
        value: false,
        color: '',
        variant: 'stroked'
      },
      {
        text: options?.yesText || 'Sim',
        value: true,
        color: 'primary',
        variant: 'raised'
      }
    ];

    return this.openConfirmationDialog({
      title,
      message,
      icon: options?.icon || 'help',
      iconColor: options?.iconColor || 'primary',
      buttons,
      maxWidth: options?.maxWidth
    });
  }

  /**
   * Método de conveniência para alerta com apenas botão OK
   */
  alert(
    title: string,
    message: string,
    options?: {
      icon?: string;
      iconColor?: 'primary' | 'accent' | 'warn';
      okText?: string;
      maxWidth?: string;
    }
  ): Observable<boolean> {
    const buttons: ConfirmationButton[] = [
      {
        text: options?.okText || 'OK',
        value: true,
        color: 'primary',
        variant: 'raised'
      }
    ];

    return this.openConfirmationDialog({
      title,
      message,
      icon: options?.icon || 'info',
      iconColor: options?.iconColor || 'primary',
      buttons,
      maxWidth: options?.maxWidth
    });
  }

  /**
   * Método para confirmação de exclusão
   */
  confirmDelete(
    itemName: string,
    options?: {
      customMessage?: string;
      deleteText?: string;
      cancelText?: string;
      maxWidth?: string;
    }
  ): Observable<boolean> {
    const message = options?.customMessage ||
      `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`;

    const buttons: ConfirmationButton[] = [
      {
        text: options?.cancelText || 'Cancelar',
        value: false,
        color: '',
        variant: 'stroked'
      },
      {
        text: options?.deleteText || 'Excluir',
        value: true,
        color: 'warn',
        variant: 'raised'
      }
    ];

    return this.openConfirmationDialog({
      title: 'Confirmar Exclusão',
      message,
      icon: 'delete_forever',
      iconColor: 'warn',
      buttons,
      maxWidth: options?.maxWidth
    });
  }

  /**
   * Método para confirmação de ações importantes
   */
  confirmAction(
    title: string,
    message: string,
    actionText: string,
    options?: {
      icon?: string;
      iconColor?: 'primary' | 'accent' | 'warn';
      cancelText?: string;
      actionColor?: 'primary' | 'accent' | 'warn';
      maxWidth?: string;
    }
  ): Observable<boolean> {
    const buttons: ConfirmationButton[] = [
      {
        text: options?.cancelText || 'Cancelar',
        value: false,
        color: '',
        variant: 'stroked'
      },
      {
        text: actionText,
        value: true,
        color: options?.actionColor || 'primary',
        variant: 'raised'
      }
    ];

    return this.openConfirmationDialog({
      title,
      message,
      icon: options?.icon || 'help',
      iconColor: options?.iconColor || 'primary',
      buttons,
      maxWidth: options?.maxWidth
    });
  }
}
