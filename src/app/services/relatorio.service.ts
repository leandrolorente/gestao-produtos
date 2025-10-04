import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface FiltroRelatorio {
  campo: string;
  valor?: string;
  tipo?: 'text' | 'select' | 'date' | 'number' | 'checkbox';
  opcoes?: string[];
  label?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RelatorioService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public readonly loading$ = this.loadingSubject.asObservable();

  /**
   * Constrói URL completa para a API
   */
  private buildUrl(endpoint: string): string {
    return `${this.apiUrl}/${endpoint}`;
  }

  /**
   * Busca dados de clientes para relatórios
   */
  getDadosClientes(): Observable<any[]> {
    return this.http.get<any[]>(this.buildUrl('clientes')).pipe(
      catchError(error => {
        console.error('Erro ao buscar clientes:', error);
        return of([]);
      })
    );
  }

  /**
   * Busca dados de produtos para relatórios
   */
  getDadosProdutos(): Observable<any[]> {
    return this.http.get<any[]>(this.buildUrl('produtos')).pipe(
      catchError(error => {
        console.error('Erro ao buscar produtos:', error);
        return of([]);
      })
    );
  }

  /**
   * Busca dados de vendas para relatórios
   */
  getDadosVendas(): Observable<any[]> {
    return this.http.get<any[]>(this.buildUrl('vendas')).pipe(
      catchError(error => {
        console.error('Erro ao buscar vendas:', error);
        return of([]);
      })
    );
  }

  /**
   * Gera relatório de clientes usando dados existentes
   */
  getRelatorioClientes(filtros?: FiltroRelatorio[]): Observable<any[]> {
    this.loadingSubject.next(true);

    return this.getDadosClientes().pipe(
      map(clientes => {
        let dadosFiltrados = [...clientes];

        if (filtros) {
          dadosFiltrados = this.aplicarFiltros(dadosFiltrados, filtros);
        }

        this.loadingSubject.next(false);
        return dadosFiltrados;
      })
    );
  }

  /**
   * Gera relatório de produtos usando dados existentes
   */
  getRelatorioProdutos(filtros?: FiltroRelatorio[]): Observable<any[]> {
    this.loadingSubject.next(true);

    return this.getDadosProdutos().pipe(
      map(produtos => {
        let dadosFiltrados = [...produtos];

        if (filtros) {
          dadosFiltrados = this.aplicarFiltros(dadosFiltrados, filtros);
        }

        this.loadingSubject.next(false);
        return dadosFiltrados;
      })
    );
  }

  /**
   * Gera relatório de vendas usando dados existentes
   */
  getRelatorioVendas(filtros?: FiltroRelatorio[]): Observable<any[]> {
    this.loadingSubject.next(true);

    return this.getDadosVendas().pipe(
      map(vendas => {
        let dadosFiltrados = [...vendas];

        if (filtros) {
          dadosFiltrados = this.aplicarFiltros(dadosFiltrados, filtros);
        }

        this.loadingSubject.next(false);
        return dadosFiltrados;
      })
    );
  }

  /**
   * Gera relatório de estoque combinando produtos e movimentações
   */
  getRelatorioEstoque(filtros?: FiltroRelatorio[]): Observable<any[]> {
    this.loadingSubject.next(true);

    return forkJoin({
      produtos: this.getDadosProdutos(),
      vendas: this.getDadosVendas()
    }).pipe(
      map(({ produtos, vendas }) => {
        // Gerar movimentações simuladas baseadas nos dados existentes
        const movimentacoes = this.gerarMovimentacaoEstoque(produtos, vendas);

        let dadosFiltrados = [...movimentacoes];

        if (filtros) {
          dadosFiltrados = this.aplicarFiltros(dadosFiltrados, filtros);
        }

        this.loadingSubject.next(false);
        return dadosFiltrados;
      })
    );
  }

  /**
   * Gera relatório financeiro combinando vendas e dados simulados
   */
  getRelatorioFinanceiro(filtros?: FiltroRelatorio[]): Observable<any[]> {
    this.loadingSubject.next(true);

    return this.getDadosVendas().pipe(
      map(vendas => {
        // Gerar transações financeiras baseadas nas vendas
        const transacoes = this.gerarTransacoesFinanceiras(vendas);

        let dadosFiltrados = [...transacoes];

        if (filtros) {
          dadosFiltrados = this.aplicarFiltros(dadosFiltrados, filtros);
        }

        this.loadingSubject.next(false);
        return dadosFiltrados;
      })
    );
  }

  /**
   * Aplica filtros aos dados
   */
  private aplicarFiltros(dados: any[], filtros: FiltroRelatorio[]): any[] {
    let dadosFiltrados = [...dados];

    filtros.forEach(filtro => {
      if (!filtro.valor) return;

      switch (filtro.campo) {
        case 'dataInicio':
          const dataInicio = new Date(filtro.valor);
          dadosFiltrados = dadosFiltrados.filter(item => {
            const itemData = new Date(item.data || item.dataVenda || item.dataCadastro);
            return itemData >= dataInicio;
          });
          break;

        case 'dataFim':
          const dataFim = new Date(filtro.valor);
          dadosFiltrados = dadosFiltrados.filter(item => {
            const itemData = new Date(item.data || item.dataVenda || item.dataCadastro);
            return itemData <= dataFim;
          });
          break;

        case 'categoria':
          dadosFiltrados = dadosFiltrados.filter(item =>
            item.categoria?.toLowerCase().includes(filtro.valor!.toLowerCase())
          );
          break;

        case 'tipo':
          dadosFiltrados = dadosFiltrados.filter(item =>
            item.tipo === filtro.valor
          );
          break;

        case 'status':
          dadosFiltrados = dadosFiltrados.filter(item =>
            item.status === filtro.valor
          );
          break;

        default:
          // Filtro genérico por string
          dadosFiltrados = dadosFiltrados.filter(item =>
            item[filtro.campo]?.toString().toLowerCase().includes(filtro.valor!.toLowerCase())
          );
      }
    });

    return dadosFiltrados;
  }

  /**
   * Gera movimentações de estoque simuladas
   */
  private gerarMovimentacaoEstoque(produtos: any[], vendas: any[]): any[] {
    const movimentacoes: any[] = [];
    const baseDate = new Date();

    // Gerar movimentações baseadas nos produtos e vendas
    produtos.forEach((produto, index) => {
      // Entrada de estoque
      movimentacoes.push({
        id: `mov-${index}-entrada`,
        data: new Date(baseDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        tipo: 'entrada',
        produto: produto.nome,
        categoria: produto.categoria || 'Geral',
        quantidade: Math.floor(Math.random() * 50) + 10,
        estoqueAnterior: Math.floor(Math.random() * 20),
        estoqueAtual: produto.quantidade || Math.floor(Math.random() * 100),
        observacao: 'Reposição de estoque'
      });
    });

    // Gerar saídas baseadas nas vendas
    vendas.forEach((venda, index) => {
      if (venda.itens) {
        venda.itens.forEach((item: any) => {
          movimentacoes.push({
            id: `mov-${index}-saida-${item.produto}`,
            data: new Date(venda.dataVenda || venda.data),
            tipo: 'saida',
            produto: item.produto,
            categoria: 'Venda',
            quantidade: item.quantidade,
            estoqueAnterior: Math.floor(Math.random() * 50) + item.quantidade,
            estoqueAtual: Math.floor(Math.random() * 50),
            observacao: `Venda #${venda.numero || venda.id}`
          });
        });
      }
    });

    return movimentacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  /**
   * Gera transações financeiras simuladas
   */
  private gerarTransacoesFinanceiras(vendas: any[]): any[] {
    const transacoes: any[] = [];
    const baseDate = new Date();

    // Receitas das vendas
    vendas.forEach((venda, index) => {
      transacoes.push({
        id: `trans-${index}-receita`,
        data: new Date(venda.dataVenda || venda.data),
        tipo: 'receita',
        categoria: 'Vendas',
        descricao: `Venda #${venda.numero || venda.id} - ${venda.cliente || 'Cliente'}`,
        valor: venda.valorTotal || venda.valor || Math.random() * 5000 + 500,
        status: Math.random() > 0.2 ? 'pago' : 'pendente',
        dataVencimento: new Date(venda.dataVenda || venda.data),
        cliente: venda.cliente
      });
    });

    // Despesas simuladas
    const categoriasDespesas = ['Fornecedores', 'Operacional', 'Pessoal', 'Marketing'];
    for (let i = 0; i < 20; i++) {
      const categoria = categoriasDespesas[Math.floor(Math.random() * categoriasDespesas.length)];
      transacoes.push({
        id: `trans-despesa-${i}`,
        data: new Date(baseDate.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        tipo: 'despesa',
        categoria,
        descricao: this.getDescricaoDespesa(categoria),
        valor: Math.random() * 10000 + 1000,
        status: Math.random() > 0.1 ? 'pago' : 'pendente',
        dataVencimento: new Date(baseDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        fornecedor: categoria === 'Fornecedores' ? 'Fornecedor Ltda' : undefined
      });
    }

    return transacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  /**
   * Gera descrição para despesas
   */
  private getDescricaoDespesa(categoria: string): string {
    const descricoes: { [key: string]: string[] } = {
      'Fornecedores': ['Compra de mercadorias', 'Reposição de estoque', 'Material de escritório'],
      'Operacional': ['Aluguel da loja', 'Energia elétrica', 'Internet', 'Telefone'],
      'Pessoal': ['Salários', 'Benefícios', 'Encargos trabalhistas'],
      'Marketing': ['Publicidade online', 'Material promocional', 'Campanhas']
    };

    const opcoes = descricoes[categoria] || ['Despesa geral'];
    return opcoes[Math.floor(Math.random() * opcoes.length)];
  }

  /**
   * Exporta dados para CSV
   */
  exportarCSV(dados: any[], nomeArquivo: string): void {
    if (dados.length === 0) return;

    const headers = Object.keys(dados[0]);
    const csvContent = [
      headers.join(','),
      ...dados.map(row =>
        headers.map(header => {
          const value = row[header]?.toString() || '';
          return value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${nomeArquivo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
