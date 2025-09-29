import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'right',
    verticalPosition: 'bottom'
  };

  /**
   * Exibe mensagem de sucesso
   */
  showSuccess(message: string, duration = 4000, action = 'Fechar'): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      duration,
      panelClass: ['snackbar-success']
    });
  }

  /**
   * Exibe mensagem de erro
   */
  showError(message: string, duration = 5000, action = 'Fechar'): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      duration,
      panelClass: ['snackbar-error']
    });
  }

  /**
   * Exibe mensagem de aviso
   */
  showWarning(message: string, duration = 4000, action = 'Fechar'): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      duration,
      panelClass: ['snackbar-warning']
    });
  }

  /**
   * Exibe mensagem informativa
   */
  showInfo(message: string, duration = 4000, action = 'Fechar'): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      duration,
      panelClass: ['snackbar-info']
    });
  }

  /**
   * Exibe mensagem personalizada
   */
  show(
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info' | 'primary' = 'primary',
    duration = 4000,
    action = 'Fechar'
  ): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      duration,
      panelClass: [`snackbar-${type}`]
    });
  }
}