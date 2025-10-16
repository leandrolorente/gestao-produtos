import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ContaPagar,
  CreateContaPagar,
  UpdateContaPagar,
  PagamentoConta,
  TotalContaPagar,
  QuantidadeVencidas,
  StatusContaPagar,
  CategoriaConta
} from '../models/ContaPagar';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContaPagarService {
  private readonly apiUrl = `${environment.apiUrl}/ContasPagar`;

  constructor(private http: HttpClient) {}

  /**
   * Obtém todas as contas a pagar
   */
  getAll(): Observable<ContaPagar[]> {
    return this.http.get<ContaPagar[]>(this.apiUrl);
  }

  /**
   * Obtém uma conta por ID
   */
  getById(id: string): Observable<ContaPagar> {
    return this.http.get<ContaPagar>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtém contas por status
   */
  getByStatus(status: StatusContaPagar): Observable<ContaPagar[]> {
    return this.http.get<ContaPagar[]>(`${this.apiUrl}/status/${status}`);
  }

  /**
   * Obtém contas vencidas
   */
  getVencidas(): Observable<ContaPagar[]> {
    return this.http.get<ContaPagar[]>(`${this.apiUrl}/vencidas`);
  }

  /**
   * Obtém contas vencendo em X dias
   */
  getVencendoEm(dias: number): Observable<ContaPagar[]> {
    return this.http.get<ContaPagar[]>(`${this.apiUrl}/vencendo/${dias}`);
  }

  /**
   * Obtém contas por fornecedor
   */
  getByFornecedor(fornecedorId: string): Observable<ContaPagar[]> {
    return this.http.get<ContaPagar[]>(`${this.apiUrl}/fornecedor/${fornecedorId}`);
  }

  /**
   * Obtém contas por período
   */
  getByPeriodo(inicio: string, fim: string): Observable<ContaPagar[]> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fim', fim);

    return this.http.get<ContaPagar[]>(`${this.apiUrl}/periodo`, { params });
  }

  /**
   * Obtém contas por categoria
   */
  getByCategoria(categoria: CategoriaConta): Observable<ContaPagar[]> {
    return this.http.get<ContaPagar[]>(`${this.apiUrl}/categoria/${categoria}`);
  }

  /**
   * Cria uma nova conta
   */
  create(conta: CreateContaPagar): Observable<ContaPagar> {
    return this.http.post<ContaPagar>(this.apiUrl, conta);
  }

  /**
   * Atualiza uma conta
   */
  update(id: string, conta: UpdateContaPagar): Observable<ContaPagar> {
    return this.http.put<ContaPagar>(`${this.apiUrl}/${id}`, conta);
  }

  /**
   * Exclui uma conta
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Realiza pagamento de uma conta
   */
  pagar(id: string, pagamento: PagamentoConta): Observable<ContaPagar> {
    return this.http.post<ContaPagar>(`${this.apiUrl}/${id}/pagar`, pagamento);
  }

  /**
   * Cancela uma conta
   */
  cancelar(id: string): Observable<ContaPagar> {
    return this.http.post<ContaPagar>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  /**
   * Obtém total a pagar por período
   */
  getTotalPagar(inicio?: string, fim?: string): Observable<TotalContaPagar> {
    let params = new HttpParams();
    if (inicio) params = params.set('inicio', inicio);
    if (fim) params = params.set('fim', fim);

    return this.http.get<TotalContaPagar>(`${this.apiUrl}/total-pagar`, { params });
  }

  /**
   * Obtém total pago por período
   */
  getTotalPago(inicio?: string, fim?: string): Observable<TotalContaPagar> {
    let params = new HttpParams();
    if (inicio) params = params.set('inicio', inicio);
    if (fim) params = params.set('fim', fim);

    return this.http.get<TotalContaPagar>(`${this.apiUrl}/total-pago`, { params });
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
  atualizarStatus(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/atualizar-status`, {});
  }

  /**
   * Processa contas recorrentes
   */
  processarRecorrentes(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/processar-recorrentes`, {});
  }

  /**
   * Métodos de conveniência para validação
   */
  canEdit(conta: ContaPagar): boolean {
    return conta.status === StatusContaPagar.Pendente;
  }

  canDelete(conta: ContaPagar): boolean {
    return conta.status === StatusContaPagar.Pendente || conta.status === StatusContaPagar.Cancelada;
  }

  canPay(conta: ContaPagar): boolean {
    return conta.status === StatusContaPagar.Pendente || conta.status === StatusContaPagar.Vencida;
  }

  canCancel(conta: ContaPagar): boolean {
    return conta.status === StatusContaPagar.Pendente || conta.status === StatusContaPagar.Vencida;
  }

  /**
   * Calcula valor líquido (original - desconto)
   */
  calcularValorLiquido(conta: ContaPagar): number {
    return conta.valorOriginal - (conta.desconto || 0);
  }

  /**
   * Verifica se a conta está vencida
   */
  isVencida(conta: ContaPagar): boolean {
    if (conta.status === StatusContaPagar.Paga) return false;
    return new Date(conta.dataVencimento) < new Date();
  }

  /**
   * Calcula dias até o vencimento
   */
  diasParaVencimento(conta: ContaPagar): number {
    const hoje = new Date();
    const vencimento = new Date(conta.dataVencimento);
    const diffTime = vencimento.getTime() - hoje.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
