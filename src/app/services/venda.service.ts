import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { Venda, VendaCreate, VendaResponse, VendasStats, VendaItem } from '../models/Venda';

@Injectable({
  providedIn: 'root'
})
export class VendaService extends BaseApiService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public readonly loading$ = this.loadingSubject.asObservable();

  // Signal para armazenar vendas localmente (cache)
  private readonly vendasSignal = signal<Venda[]>([]);

  constructor(protected override http: HttpClient) {
    super(http);
  }

  /**
   * Adiciona o token JWT aos headers das requisições
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      return headers.set('Authorization', `Bearer ${token}`);
    }

    console.warn('Token JWT não encontrado no localStorage');
    return headers;
  }

  /**
   * Opções HTTP com autenticação
   */
  private get authHttpOptions() {
    return {
      headers: this.getAuthHeaders()
    };
  }

  /**
   * Obtém todas as vendas
   */
  getAllVendas(): Observable<Venda[]> {
    this.setLoading(true);

    return this.http.get<VendaResponse[]>(this.buildUrl('vendas'), this.authHttpOptions)
      .pipe(
        map(response => response.map(venda => this.convertFromApi(venda))),
        tap(vendas => {
          this.vendasSignal.set(vendas);
          this.setLoading(false);
        }),
        catchError(error => {
          console.error('Erro ao buscar vendas:', error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtém uma venda por ID
   */
  getVendaById(id: string): Observable<Venda> {
    this.setLoading(true);

    return this.http.get<VendaResponse>(this.buildUrl(`vendas/${id}`), this.authHttpOptions)
      .pipe(
        map(response => this.convertFromApi(response)),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('Erro ao buscar venda:', error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtém uma venda por número
   */
  getVendaByNumero(numero: string): Observable<Venda> {
    this.setLoading(true);

    return this.http.get<VendaResponse>(this.buildUrl(`vendas/numero/${numero}`), this.authHttpOptions)
      .pipe(
        map(response => this.convertFromApi(response)),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('Erro ao buscar venda por número:', error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtém vendas por cliente
   */
  getVendasByCliente(clienteId: string): Observable<Venda[]> {
    this.setLoading(true);

    return this.http.get<VendaResponse[]>(this.buildUrl(`vendas/cliente/${clienteId}`), this.authHttpOptions)
      .pipe(
        map(response => response.map(venda => this.convertFromApi(venda))),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('Erro ao buscar vendas por cliente:', error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtém vendas por vendedor
   */
  getVendasByVendedor(vendedorId: string): Observable<Venda[]> {
    this.setLoading(true);

    return this.http.get<VendaResponse[]>(this.buildUrl(`vendas/vendedor/${vendedorId}`), this.authHttpOptions)
      .pipe(
        map(response => response.map(venda => this.convertFromApi(venda))),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('Erro ao buscar vendas por vendedor:', error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtém vendas por status
   */
  getVendasByStatus(status: string): Observable<Venda[]> {
    this.setLoading(true);

    return this.http.get<VendaResponse[]>(this.buildUrl(`vendas/status/${status}`), this.authHttpOptions)
      .pipe(
        map(response => response.map(venda => this.convertFromApi(venda))),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('Erro ao buscar vendas por status:', error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtém vendas por período
   */
  getVendasByPeriodo(dataInicio: Date, dataFim: Date): Observable<Venda[]> {
    this.setLoading(true);

    const params = this.buildParams({
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim.toISOString()
    });

    return this.http.get<VendaResponse[]>(this.buildUrl('vendas/periodo'), {
      ...this.authHttpOptions,
      params
    })
      .pipe(
        map(response => response.map(venda => this.convertFromApi(venda))),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('Erro ao buscar vendas por período:', error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtém vendas vencidas
   */
  getVendasVencidas(): Observable<Venda[]> {
    this.setLoading(true);

    return this.http.get<VendaResponse[]>(this.buildUrl('vendas/vencidas'), this.authHttpOptions)
      .pipe(
        map(response => response.map(venda => this.convertFromApi(venda))),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('Erro ao buscar vendas vencidas:', error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtém vendas de hoje
   */
  getVendasHoje(): Observable<Venda[]> {
    this.setLoading(true);

    return this.http.get<VendaResponse[]>(this.buildUrl('vendas/hoje'), this.authHttpOptions)
      .pipe(
        map(response => response.map(venda => this.convertFromApi(venda))),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('Erro ao buscar vendas de hoje:', error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Cria uma nova venda
   */
  createVenda(vendaData: VendaCreate): Observable<Venda> {
    this.setLoading(true);

    const body = this.convertCreateToApi(vendaData);
    console.log('Dados enviados para API:', body);

    return this.http.post<VendaResponse>(this.buildUrl('vendas'), body, this.authHttpOptions)
      .pipe(
        map(response => this.convertFromApi(response)),
        tap(novaVenda => {
          const vendasAtuais = this.vendasSignal();
          this.vendasSignal.set([...vendasAtuais, novaVenda]);
          this.setLoading(false);
        }),
        catchError(error => {
          console.error('Erro ao criar venda:', error);
          console.error('Resposta da API:', error.error);
          console.error('Status:', error.status);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Atualiza uma venda existente
   */
  updateVenda(venda: Venda): Observable<Venda> {
    this.setLoading(true);

    const body = this.convertToApi(venda);

    return this.http.put<VendaResponse>(this.buildUrl(`vendas/${venda.id}`), body, this.authHttpOptions)
      .pipe(
        map(response => this.convertFromApi(response)),
        tap(vendaAtualizada => {
          const vendas = this.vendasSignal();
          const index = vendas.findIndex(v => v.id === vendaAtualizada.id);
          if (index !== -1) {
            const novasVendas = [...vendas];
            novasVendas[index] = vendaAtualizada;
            this.vendasSignal.set(novasVendas);
          }
          this.setLoading(false);
        }),
        catchError(error => {
          console.error('Erro ao atualizar venda:', error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Remove uma venda
   */
  deleteVenda(id: string): Observable<void> {
    this.setLoading(true);

    return this.http.delete<void>(this.buildUrl(`vendas/${id}`), this.authHttpOptions)
      .pipe(
        tap(() => {
          const vendas = this.vendasSignal();
          this.vendasSignal.set(vendas.filter(v => v.id !== id));
          this.setLoading(false);
        }),
        catchError(error => {
          console.error('Erro ao excluir venda:', error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Processa uma venda seguindo o fluxo completo: Confirmar → Finalizar
   * Apenas para vendas com status 'Pendente'
   */
  processarVendaCompleta(id: string): Observable<Venda> {
    this.setLoading(true);

    // Primeiro, confirma a venda
    return this.confirmarVenda(id).pipe(
      // Depois de confirmar, finaliza automaticamente
      switchMap((vendaConfirmada: Venda) => {
        if (vendaConfirmada.status === 'Confirmada') {
          return this.finalizarVenda(id);
        } else {
          throw new Error(`Venda não pode ser processada. Status atual: ${vendaConfirmada.status}`);
        }
      }),
      catchError(error => {
        console.error('Erro ao processar venda completa:', error);
        this.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Confirma uma venda pendente
   */
  confirmarVenda(id: string): Observable<Venda> {
    this.setLoading(true);

    return this.http.patch<VendaResponse>(this.buildUrl(`vendas/${id}/confirmar`), {}, this.authHttpOptions)
      .pipe(
        map(response => this.convertFromApi(response)),
        tap(vendaAtualizada => {
          console.log(`Venda ${id} confirmada. Status: ${vendaAtualizada.status}`);
          this.atualizarVendaNoCache(vendaAtualizada);
          this.setLoading(false);
        }),
        catchError(error => {
          console.error('Erro ao confirmar venda:', error);
          console.error('Detalhes do erro:', error.error);
          this.setLoading(false);
          
          // Tratamento específico para erro de fluxo
          if (error.status === 400 && error.error?.message) {
            throw new Error(error.error.message);
          }
          
          return throwError(() => error);
        })
      );
  }

  /**
   * Finaliza uma venda confirmada
   */
  finalizarVenda(id: string): Observable<Venda> {
    this.setLoading(true);

    return this.http.patch<VendaResponse>(this.buildUrl(`vendas/${id}/finalizar`), {}, this.authHttpOptions)
      .pipe(
        map(response => this.convertFromApi(response)),
        tap(vendaAtualizada => {
          console.log(`Venda ${id} finalizada. Status: ${vendaAtualizada.status}`);
          this.atualizarVendaNoCache(vendaAtualizada);
          this.setLoading(false);
        }),
        catchError(error => {
          console.error('Erro ao finalizar venda:', error);
          console.error('Detalhes do erro:', error.error);
          this.setLoading(false);
          
          // Tratamento específico para erro de fluxo
          if (error.status === 400 && error.error?.message) {
            throw new Error(error.error.message);
          }
          
          return throwError(() => error);
        })
      );
  }

  /**
   * Cancela uma venda (Pendente ou Confirmada)
   */
  cancelarVenda(id: string): Observable<Venda> {
    this.setLoading(true);

    return this.http.patch<VendaResponse>(this.buildUrl(`vendas/${id}/cancelar`), {}, this.authHttpOptions)
      .pipe(
        map(response => this.convertFromApi(response)),
        tap(vendaAtualizada => {
          console.log(`Venda ${id} cancelada. Status: ${vendaAtualizada.status}`);
          this.atualizarVendaNoCache(vendaAtualizada);
          this.setLoading(false);
        }),
        catchError(error => {
          console.error('Erro ao cancelar venda:', error);
          console.error('Detalhes do erro:', error.error);
          this.setLoading(false);
          
          // Tratamento específico para erro de fluxo
          if (error.status === 400 && error.error?.message) {
            throw new Error(error.error.message);
          }
          
          return throwError(() => error);
        })
      );
  }

  /**
   * Verifica se uma venda pode ser confirmada
   */
  podeConfirmar(venda: Venda): boolean {
    return venda.status === 'Pendente';
  }

  /**
   * Verifica se uma venda pode ser finalizada
   */
  podeFinalizar(venda: Venda): boolean {
    return venda.status === 'Confirmada';
  }

  /**
   * Verifica se uma venda pode ser cancelada
   */
  podeCancelar(venda: Venda): boolean {
    return venda.status === 'Pendente' || venda.status === 'Confirmada';
  }

  /**
   * Verifica se uma venda pode ser editada
   */
  podeEditar(venda: Venda): boolean {
    return venda.status === 'Pendente';
  }

  /**
   * Atualiza uma venda no cache local
   */
  private atualizarVendaNoCache(vendaAtualizada: Venda): void {
    const vendas = this.vendasSignal();
    const index = vendas.findIndex(v => v.id === vendaAtualizada.id);
    if (index !== -1) {
      const novasVendas = [...vendas];
      novasVendas[index] = vendaAtualizada;
      this.vendasSignal.set(novasVendas);
    }
  }

  /**
   * Obtém estatísticas de vendas
   */
  getVendasStats(): Observable<VendasStats> {
    this.setLoading(true);

    return this.http.get<VendasStats>(this.buildUrl('vendas/stats'), this.authHttpOptions)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('Erro ao buscar estatísticas:', error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtém próximo número de venda disponível
   */
  getProximoNumero(): Observable<{ numero: string }> {
    this.setLoading(true);

    return this.http.get<{ numero: string }>(this.buildUrl('vendas/proximo-numero'), this.authHttpOptions)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('Erro ao buscar próximo número:', error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Converte resposta da API para modelo interno
   */
  private convertFromApi(apiVenda: VendaResponse): Venda {
    return {
      id: apiVenda.id,
      numero: apiVenda.numero,
      clienteId: apiVenda.clienteId,
      clienteNome: apiVenda.clienteNome,
      clienteEmail: apiVenda.clienteEmail,
      items: apiVenda.items,
      subtotal: apiVenda.subtotal,
      desconto: apiVenda.desconto,
      total: apiVenda.total,
      formaPagamento: apiVenda.formaPagamento as any,
      status: apiVenda.status as any,
      observacoes: apiVenda.observacoes,
      dataVenda: new Date(apiVenda.dataVenda),
      dataVencimento: apiVenda.dataVencimento ? new Date(apiVenda.dataVencimento) : undefined,
      vendedorId: apiVenda.vendedorId,
      vendedorNome: apiVenda.vendedorNome,
      ultimaAtualizacao: new Date(apiVenda.updatedAt)
    };
  }

  /**
   * Converte modelo interno para envio à API
   */
  private convertToApi(venda: Partial<Venda>): any {
    return {
      numero: venda.numero,
      clienteId: venda.clienteId,
      items: venda.items,
      subtotal: venda.subtotal,
      desconto: venda.desconto,
      total: venda.total,
      formaPagamento: venda.formaPagamento,
      status: venda.status,
      observacoes: venda.observacoes,
      dataVenda: venda.dataVenda?.toISOString(),
      dataVencimento: venda.dataVencimento?.toISOString(),
      vendedorId: venda.vendedorId,
      vendedorNome: venda.vendedorNome
    };
  }

  /**
   * Converte dados de criação para envio à API
   */
  private convertCreateToApi(vendaData: VendaCreate): any {
    return {
      clienteId: vendaData.clienteId,
      items: vendaData.items.map(item => ({
        produtoId: item.produtoId,
        produtoNome: item.produtoNome,
        produtoSku: item.produtoSku,
        quantidade: Number(item.quantidade),
        precoUnitario: Number(item.precoUnitario),
        subtotal: Number(item.subtotal)
      })),
      desconto: Number(vendaData.desconto) || 0,
      formaPagamento: vendaData.formaPagamento,
      observacoes: vendaData.observacoes || undefined,
      dataVencimento: vendaData.dataVencimento?.toISOString() || undefined
    };
  }

  /**
   * Controla o estado de loading
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Getter para o signal de vendas (somente leitura)
   */
  get vendasSignalReadonly() {
    return this.vendasSignal.asReadonly();
  }
}
