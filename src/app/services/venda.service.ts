import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, tap, map, delay } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { Venda, VendaCreate, VendaResponse, VendasStats, VendaItem } from '../models/Venda';

@Injectable({
  providedIn: 'root'
})
export class VendaService extends BaseApiService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public readonly loading$ = this.loadingSubject.asObservable();

  // Signal para armazenar vendas localmente
  private readonly vendasSignal = signal<Venda[]>([]);

  // Dados mockados para demonstração
  private readonly MOCK_VENDAS: Venda[] = [
    {
      id: '67781ba123456789abcdef01',
      numero: 'VND-001',
      clienteId: '67781ba123456789abcdef01',
      clienteNome: 'João Silva',
      clienteEmail: 'joao.silva@email.com',
      items: [
        {
          id: '1',
          produtoId: '67781ba123456789abcdef01',
          produtoNome: 'Teclado Mecânico RGB',
          produtoSku: 'TEC-001',
          quantidade: 2,
          precoUnitario: 150.00,
          subtotal: 300.00
        },
        {
          id: '2',
          produtoId: '67781ba123456789abcdef02',
          produtoNome: 'Mouse Gamer',
          produtoSku: 'MOU-001',
          quantidade: 1,
          precoUnitario: 80.00,
          subtotal: 80.00
        }
      ],
      subtotal: 380.00,
      desconto: 20.00,
      total: 360.00,
      formaPagamento: 'PIX',
      status: 'Finalizada',
      observacoes: 'Cliente VIP - desconto aplicado',
      dataVenda: new Date('2024-12-15'),
      vendedorId: '67781ba123456789abcdef01',
      vendedorNome: 'Maria Santos',
      ultimaAtualizacao: new Date()
    },
    {
      id: '67781ba123456789abcdef02',
      numero: 'VND-002',
      clienteId: '67781ba123456789abcdef02',
      clienteNome: 'Ana Costa',
      clienteEmail: 'ana.costa@email.com',
      items: [
        {
          id: '3',
          produtoId: '67781ba123456789abcdef03',
          produtoNome: 'Monitor 24"',
          produtoSku: 'MON-001',
          quantidade: 1,
          precoUnitario: 450.00,
          subtotal: 450.00
        }
      ],
      subtotal: 450.00,
      desconto: 0,
      total: 450.00,
      formaPagamento: 'Cartão de Crédito',
      status: 'Confirmada',
      dataVenda: new Date('2024-12-14'),
      dataVencimento: new Date('2024-12-21'),
      vendedorId: '67781ba123456789abcdef01',
      vendedorNome: 'Maria Santos',
      ultimaAtualizacao: new Date()
    },
    {
      id: '67781ba123456789abcdef03',
      numero: 'VND-003',
      clienteId: '67781ba123456789abcdef03',
      clienteNome: 'Pedro Oliveira',
      clienteEmail: 'pedro.oliveira@email.com',
      items: [
        {
          id: '4',
          produtoId: '67781ba123456789abcdef04',
          produtoNome: 'Notebook Gamer',
          produtoSku: 'NOT-001',
          quantidade: 1,
          precoUnitario: 2500.00,
          subtotal: 2500.00
        }
      ],
      subtotal: 2500.00,
      desconto: 100.00,
      total: 2400.00,
      formaPagamento: 'Boleto',
      status: 'Pendente',
      observacoes: 'Aguardando pagamento do boleto',
      dataVenda: new Date(),
      dataVencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      vendedorId: '67781ba123456789abcdef02',
      vendedorNome: 'Carlos Mendes',
      ultimaAtualizacao: new Date()
    }
  ];

  constructor(protected override http: HttpClient) {
    super(http);
    this.vendasSignal.set(this.MOCK_VENDAS);
  }

  /**
   * Obtém todas as vendas
   */
  getAllVendas(): Observable<Venda[]> {
    this.setLoading(true);

    return this.http.get<VendaResponse[]>(this.buildUrl('vendas'), this.httpOptions)
      .pipe(
        map(response => response.map(venda => this.convertFromApi(venda))),
        tap(vendas => {
          this.vendasSignal.set(vendas);
          this.setLoading(false);
        }),
        catchError(error => {
          console.error('Erro ao buscar vendas:', error);
          this.setLoading(false);
          // Retorna dados mockados como fallback
          return of(this.MOCK_VENDAS);
        })
      );
  }

  /**
   * Obtém uma venda por ID
   */
  getVendaById(id: string): Observable<Venda> {
    this.setLoading(true);

    return this.http.get<VendaResponse>(this.buildUrl(`vendas/${id}`), this.httpOptions)
      .pipe(
        map(response => this.convertFromApi(response)),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('Erro ao buscar venda:', error);
          this.setLoading(false);

          // Busca nos dados mockados
          const venda = this.MOCK_VENDAS.find(v => v.id === id);
          if (venda) {
            return of(venda);
          }

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

    return this.http.post<VendaResponse>(this.buildUrl('vendas'), body, this.httpOptions)
      .pipe(
        map(response => this.convertFromApi(response)),
        tap(novaVenda => {
          const vendasAtuais = this.vendasSignal();
          this.vendasSignal.set([...vendasAtuais, novaVenda]);
          this.setLoading(false);
        }),
        catchError(error => {
          console.error('Erro ao criar venda:', error);
          this.setLoading(false);

          // Simula criação local para desenvolvimento
          const novaVenda: Venda = {
            id: new Date().getTime().toString(),
            numero: `VND-${String(this.vendasSignal().length + 1).padStart(3, '0')}`,
            clienteId: vendaData.clienteId,
            clienteNome: 'Cliente Mock', // Seria obtido do serviço de clientes
            clienteEmail: 'cliente@mock.com',
            items: vendaData.items.map((item, index) => ({
              ...item,
              id: `${new Date().getTime()}_${index}`
            })),
            subtotal: vendaData.items.reduce((sum, item) => sum + (item.precoUnitario * item.quantidade), 0),
            desconto: vendaData.desconto || 0,
            total: vendaData.items.reduce((sum, item) => sum + (item.precoUnitario * item.quantidade), 0) - (vendaData.desconto || 0),
            formaPagamento: vendaData.formaPagamento as any,
            status: 'Pendente',
            observacoes: vendaData.observacoes,
            dataVenda: new Date(),
            dataVencimento: vendaData.dataVencimento,
            ultimaAtualizacao: new Date()
          };

          const vendasAtuais = this.vendasSignal();
          this.vendasSignal.set([...vendasAtuais, novaVenda]);

          return of(novaVenda);
        })
      );
  }

  /**
   * Atualiza uma venda existente
   */
  updateVenda(venda: Venda): Observable<Venda> {
    this.setLoading(true);

    const body = this.convertToApi(venda);

    return this.http.put<VendaResponse>(this.buildUrl(`vendas/${venda.id}`), body, this.httpOptions)
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

          // Simula atualização local
          const vendas = this.vendasSignal();
          const index = vendas.findIndex(v => v.id === venda.id);
          if (index !== -1) {
            const novasVendas = [...vendas];
            novasVendas[index] = { ...venda, ultimaAtualizacao: new Date() };
            this.vendasSignal.set(novasVendas);
            return of(novasVendas[index]);
          }

          return throwError(() => error);
        })
      );
  }

  /**
   * Remove uma venda
   */
  deleteVenda(id: string): Observable<void> {
    this.setLoading(true);

    return this.http.delete<void>(this.buildUrl(`vendas/${id}`), this.httpOptions)
      .pipe(
        tap(() => {
          const vendas = this.vendasSignal();
          this.vendasSignal.set(vendas.filter(v => v.id !== id));
          this.setLoading(false);
        }),
        catchError(error => {
          console.error('Erro ao excluir venda:', error);
          this.setLoading(false);

          // Simula exclusão local
          const vendas = this.vendasSignal();
          this.vendasSignal.set(vendas.filter(v => v.id !== id));

          return of(void 0);
        })
      );
  }

  /**
   * Obtém estatísticas de vendas
   */
  getVendasStats(): Observable<VendasStats> {
    this.setLoading(true);

    return this.http.get<VendasStats>(this.buildUrl('vendas/stats'), this.httpOptions)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('Erro ao buscar estatísticas:', error);
          this.setLoading(false);

          // Retorna estatísticas mockadas
          const vendas = this.vendasSignal();
          const mockStats: VendasStats = {
            totalVendas: vendas.length,
            vendasHoje: vendas.filter(v =>
              new Date(v.dataVenda).toDateString() === new Date().toDateString()
            ).length,
            faturamentoMes: vendas
              .filter(v => v.status === 'Finalizada')
              .reduce((sum, v) => sum + v.total, 0),
            ticketMedio: vendas.length > 0 ?
              vendas.reduce((sum, v) => sum + v.total, 0) / vendas.length : 0,
            vendasPendentes: vendas.filter(v => v.status === 'Pendente').length,
            topClientes: [
              { clienteNome: 'João Silva', totalCompras: 5, valorTotal: 1500.00 },
              { clienteNome: 'Ana Costa', totalCompras: 3, valorTotal: 890.00 },
              { clienteNome: 'Pedro Oliveira', totalCompras: 2, valorTotal: 2400.00 }
            ],
            vendasPorMes: [
              { mes: 'Nov', vendas: 45, faturamento: 12500.00 },
              { mes: 'Dez', vendas: 52, faturamento: 15800.00 }
            ]
          };

          return of(mockStats);
        })
      );
  }

  /**
   * Gera próximo número de venda
   */
  getProximoNumero(): Observable<string> {
    const vendas = this.vendasSignal();
    const proximoNumero = `VND-${String(vendas.length + 1).padStart(3, '0')}`;
    return of(proximoNumero);
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
      items: vendaData.items,
      desconto: vendaData.desconto,
      formaPagamento: vendaData.formaPagamento,
      observacoes: vendaData.observacoes,
      dataVencimento: vendaData.dataVencimento?.toISOString()
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
