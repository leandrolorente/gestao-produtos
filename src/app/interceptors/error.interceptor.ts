import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Erro desconhecido';

      // Verifica se ErrorEvent está disponível (navegador)
      if (typeof ErrorEvent !== 'undefined' && error.error instanceof ErrorEvent) {
        // Erro do lado do cliente
        errorMessage = `Erro: ${error.error.message}`;
      } else {
        // Erro do lado do servidor
        switch (error.status) {
          case 400:
            errorMessage = 'Dados inválidos enviados';
            break;
          case 401:
            errorMessage = 'Não autorizado';
            break;
          case 403:
            errorMessage = 'Acesso negado';
            break;
          case 404:
            errorMessage = 'Recurso não encontrado';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor';
            break;
          default:
            errorMessage = `Erro ${error.status}: ${error.message}`;
        }
      }

      console.error('Erro HTTP:', error);

      // Só mostra snackbar se estiver no navegador
      if (typeof window !== 'undefined') {
        snackBar.open(errorMessage, 'Fechar', {
          duration: 5000,
          panelClass: ['snackbar-error'],
          horizontalPosition: 'right',
          verticalPosition: 'bottom'
        });
      }

      return throwError(() => error);
    })
  );
};
