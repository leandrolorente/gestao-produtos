import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected readonly apiUrl: string;

  protected readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(protected http: HttpClient) {
    // Detecta automaticamente o ambiente e configura a API URL
    this.apiUrl = this.getApiUrl();

    console.log('🚀 BaseApiService inicializado');
    console.log('🌍 Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'SSR');
    console.log('📡 API URL:', this.apiUrl);
    console.log('🔧 Environment:', environment.production ? 'PRODUCTION' : 'DEVELOPMENT');
  }

  private getApiUrl(): string {
    // Se estiver no servidor (SSR), usa environment
    if (typeof window === 'undefined') {
      return environment.apiUrl;
    }

    const hostname = window.location.hostname;

    // Desenvolvimento local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5278/api';
    }

    // Netlify ou produção
    return 'https://gestao-produtos-api.onrender.com/api';
  }

  protected handleError(error: any): Observable<never> {
    console.error('Erro na API:', error);
    return throwError(() => error);
  }

  protected buildUrl(endpoint: string): string {
    return `${this.apiUrl}/${endpoint}`;
  }

  protected buildParams(params?: { [key: string]: any }): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return httpParams;
  }
}
