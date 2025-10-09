import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ContaReceber,
  CreateContaReceber,
  UpdateContaReceber,
  RecebimentoConta,
  TotalContaReceber,
  StatusContaReceber
} from '../models/ContaReceber';
import { QuantidadeVencidas } from '../models/ContaPagar';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContaReceberService {
  private readonly apiUrl = `${environment.apiUrl}/ContasReceber`;

  constructor(private http: HttpClient) {}

  /**
   * Obtém todas as contas a receber
   */
  getAll(): Observable<ContaReceber[]> {
    return this.http.get<ContaReceber[]>(this.apiUrl);
  }

  /**
   * Obtém uma conta por ID
   */
  getById(id: string): Observable<ContaReceber> {
    return this.http.get<ContaReceber>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtém contas por status
   */
  getByStatus(status: StatusContaReceber): Observable<ContaReceber[]> {
    return this.http.get<ContaReceber[]>(`${this.apiUrl}/status/${status}`);
  }

  /**
   * Obtém contas vencidas
   */
  getVencidas(): Observable<ContaReceber[]> {
    return this.http.get<ContaReceber[]>(`${this.apiUrl}/vencidas`);
  }

  /**
   * Obtém contas vencendo em X dias
   */
  getVencendoEm(dias: number): Observable<ContaReceber[]> {
    return this.http.get<ContaReceber[]>(`${this.apiUrl}/vencendo/${dias}`);
  }

  /**
   * Obtém contas por cliente
   */
  getByCliente(clienteId: string): Observable<ContaReceber[]> {
    return this.http.get<ContaReceber[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  /**
   * Obtém contas por vendedor
   */
  getByVendedor(vendedorId: string): Observable<ContaReceber[]> {
    return this.http.get<ContaReceber[]>(`${this.apiUrl}/vendedor/${vendedorId}`);
  }

  /**
   * Obtém contas por período
   */
  getByPeriodo(inicio: string, fim: string): Observable<ContaReceber[]> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fim', fim);

    return this.http.get<ContaReceber[]>(`${this.apiUrl}/periodo`, { params });
  }

  /**
   * Cria uma nova conta
   */
  create(conta: CreateContaReceber): Observable<ContaReceber> {
    return this.http.post<ContaReceber>(this.apiUrl, conta);
  }

  /**
   * Atualiza uma conta
   */
  update(id: string, conta: UpdateContaReceber): Observable<ContaReceber> {
    return this.http.put<ContaReceber>(`${this.apiUrl}/${id}`, conta);
  }

  /**
   * Exclui uma conta
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Realiza recebimento de uma conta
   */
  receber(id: string, recebimento: RecebimentoConta): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/receber`, recebimento);
  }

  /**
   * Cancela uma conta
   */
  cancelar(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  /**
   * Obtém total a receber por período
   */
  getTotalReceber(inicio?: string, fim?: string): Observable<TotalContaReceber> {
    let params = new HttpParams();
    if (inicio) params = params.set('inicio', inicio);
    if (fim) params = params.set('fim', fim);

    return this.http.get<TotalContaReceber>(`${this.apiUrl}/total-receber`, { params });
  }

  /**
   * Obtém total recebido por período
   */
  getTotalRecebido(inicio?: string, fim?: string): Observable<TotalContaReceber> {
    let params = new HttpParams();
    if (inicio) params = params.set('inicio', inicio);
    if (fim) params = params.set('fim', fim);

    return this.http.get<TotalContaReceber>(`${this.apiUrl}/total-recebido`, { params });
  }

  /**
   * Obtém quantidade de vencidas
   */
  getQuantidadeVencidas(): Observable<QuantidadeVencidas> {
    return this.http.get<QuantidadeVencidas>(`${this.apiUrl}/quantidade-vencidas`);
  }

  /**
   * Atualiza status das contas
   */
  atualizarStatus(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/atualizar-status`, {});
  }

  /**
   * Processa contas recorrentes
   */
  processarRecorrentes(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/processar-recorrentes`, {});
  }
}
