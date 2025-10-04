import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ViaCepResponse, ValidacaoResponse, ErrorResponse } from '../models/ViaCep';

@Injectable({
  providedIn: 'root'
})
export class ViaCepService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Busca dados do CEP através da API
   * @param cep CEP para buscar (pode estar formatado ou não)
   * @returns Observable com os dados do CEP
   */
  buscarCep(cep: string): Observable<ViaCepResponse> {
    const cepLimpo = this.limparCep(cep);
    return this.http.get<ViaCepResponse>(`${this.apiUrl}/viacep/${cepLimpo}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Valida se o CEP é válido
   * @param cep CEP para validar
   * @returns Observable com resultado da validação
   */
  validarCep(cep: string): Observable<ValidacaoResponse> {
    const cepLimpo = this.limparCep(cep);
    return this.http.get<ValidacaoResponse>(`${this.apiUrl}/viacep/validar/${cepLimpo}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Remove formatação do CEP (deixa apenas números)
   * @param cep CEP formatado ou não
   * @returns CEP apenas com números
   */
  private limparCep(cep: string): string {
    return cep.replace(/\D/g, '');
  }

  /**
   * Formata CEP para exibição (00000-000)
   * @param cep CEP sem formatação
   * @returns CEP formatado
   */
  formatarCep(cep: string): string {
    const cepLimpo = this.limparCep(cep);
    return cepLimpo.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }

  /**
   * Trata erros das requisições HTTP
   * @param error Erro da requisição
   * @returns Observable com erro tratado
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Erro desconhecido';

    if (error.error instanceof ErrorEvent) {
      // Erro do cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do servidor
      const errorResponse: ErrorResponse = error.error;
      errorMessage = errorResponse?.message || `Erro ${error.status}: ${error.message}`;
    }

    return throwError(() => new Error(errorMessage));
  }
}
