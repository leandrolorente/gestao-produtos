// src/app/pages/reports/financeiro/relatorio-financeiro.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ChartConfiguration, ChartType } from 'chart.js';

import { RelatorioService, FiltroRelatorio } from '../../../services/relatorio.service';
import { FiltrosRelatorioComponent } from '../../../components/filtros-relatorio/filtros-relatorio.component';

interface TransacaoFinanceira {
  id: string;
  descricao: string;
  tipo: 'receita' | 'despesa';
  valor: number;
  categoria: string;
  data: Date;
  status: 'pago' | 'pendente' | 'vencido';
}

interface ResumoFinanceiro {
  totalReceitas: number;
  totalDespesas: number;
  saldoLiquido: number;
  transacoesPendentes: number;
}

@Component({
  selector: 'app-relatorio-financeiro',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    FiltrosRelatorioComponent
  ],
  templateUrl: './relatorio-financeiro.component.html',
  styleUrl: './relatorio-financeiro.component.scss'
})
export class RelatorioFinanceiroComponent implements OnInit {
  protected carregando = signal(false);
  protected transacoes = signal<TransacaoFinanceira[]>([]);
  protected resumo = signal<ResumoFinanceiro>({
    totalReceitas: 0,
    totalDespesas: 0,
    saldoLiquido: 0,
    transacoesPendentes: 0
  });

  protected filtrosAplicados = signal<FiltroRelatorio[]>([]);
  protected displayedColumns: string[] = ['descricao', 'tipo', 'valor', 'categoria', 'data', 'status'];

  // Configurações dos gráficos
  protected lineChartType: ChartType = 'line';
  protected barChartType: ChartType = 'bar';
  protected pieChartType: ChartType = 'pie';

  protected lineChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };

  protected barChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };

  protected pieChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };

  protected lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Fluxo de Caixa' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  protected barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Receitas vs Despesas por Categoria' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  protected pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Distribuição por Categoria' }
    }
  };

  constructor(private relatorioService: RelatorioService) {}

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.carregando.set(true);
    
    // Primeiro carregamos os dados das vendas para gerar as transações financeiras
    this.relatorioService.getDadosVendas().subscribe({
      next: (dadosVendas: any[]) => {
        const transacoesGeradas = this.gerarTransacoesFinanceiras(dadosVendas);
        this.transacoes.set(transacoesGeradas);
        this.atualizarResumo(transacoesGeradas);
        this.atualizarGraficos(transacoesGeradas);
        this.carregando.set(false);
      },
      error: (error: any) => {
        console.error('Erro ao carregar dados financeiros:', error);
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros(filtros: FiltroRelatorio[]) {
    this.filtrosAplicados.set(filtros);
    this.carregarDados();
  }

  exportarCSV() {
    const dados = this.transacoes();
    if (dados.length === 0) return;

    const headers = ['Descrição', 'Tipo', 'Valor', 'Categoria', 'Data', 'Status'];
    const csvContent = [
      headers.join(','),
      ...dados.map(transacao => [
        transacao.descricao,
        transacao.tipo,
        transacao.valor.toFixed(2),
        transacao.categoria,
        transacao.data.toLocaleDateString('pt-BR'),
        transacao.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  private gerarTransacoesFinanceiras(vendas: any[]): TransacaoFinanceira[] {
    const transacoes: TransacaoFinanceira[] = [];
    
    // Gerar receitas baseadas nas vendas
    vendas.forEach((venda, index) => {
      transacoes.push({
        id: `receita_${index}`,
        descricao: `Venda ${venda.numero || venda.id || index}`,
        tipo: 'receita',
        valor: parseFloat(venda.valor) || parseFloat(venda.total) || 0,
        categoria: 'Vendas',
        data: new Date(venda.data || venda.dataVenda || venda.createdAt || Date.now()),
        status: venda.status === 'pago' ? 'pago' : 'pendente'
      });
    });

    // Gerar algumas despesas fictícias
    const categoriasDespesas = ['Fornecedores', 'Salários', 'Aluguel', 'Energia', 'Internet', 'Marketing'];
    const agora = new Date();
    
    for (let i = 0; i < 30; i++) {
      const data = new Date(agora);
      data.setDate(data.getDate() - i);
      
      // Gerar 1-3 despesas por dia
      const numDespesas = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numDespesas; j++) {
        const categoria = categoriasDespesas[Math.floor(Math.random() * categoriasDespesas.length)];
        
        transacoes.push({
          id: `despesa_${i}_${j}`,
          descricao: `Pagamento - ${categoria}`,
          tipo: 'despesa',
          valor: Math.floor(Math.random() * 5000) + 100,
          categoria,
          data,
          status: Math.random() > 0.2 ? 'pago' : 'pendente'
        });
      }
    }

    return transacoes.sort((a, b) => b.data.getTime() - a.data.getTime());
  }

  private atualizarResumo(transacoes: TransacaoFinanceira[]) {
    const receitas = transacoes.filter(t => t.tipo === 'receita');
    const despesas = transacoes.filter(t => t.tipo === 'despesa');
    
    const totalReceitas = receitas.reduce((sum, t) => sum + t.valor, 0);
    const totalDespesas = despesas.reduce((sum, t) => sum + t.valor, 0);
    const transacoesPendentes = transacoes.filter(t => t.status === 'pendente').length;

    this.resumo.set({
      totalReceitas,
      totalDespesas,
      saldoLiquido: totalReceitas - totalDespesas,
      transacoesPendentes
    });
  }

  private atualizarGraficos(transacoes: TransacaoFinanceira[]) {
    this.atualizarGraficoFluxoCaixa(transacoes);
    this.atualizarGraficoReceitasDespesas(transacoes);
    this.atualizarGraficoDistribuicaoCategoria(transacoes);
  }

  private atualizarGraficoFluxoCaixa(transacoes: TransacaoFinanceira[]) {
    const agora = new Date();
    const meses = [];
    const receitas = [];
    const despesas = [];

    for (let i = 11; i >= 0; i--) {
      const mes = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const proximoMes = new Date(agora.getFullYear(), agora.getMonth() - i + 1, 1);
      
      const transacoesDoMes = transacoes.filter(t => 
        t.data >= mes && t.data < proximoMes
      );
      
      const receitasMes = transacoesDoMes
        .filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + t.valor, 0);
        
      const despesasMes = transacoesDoMes
        .filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + t.valor, 0);
      
      meses.push(mes.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
      receitas.push(receitasMes);
      despesas.push(despesasMes);
    }

    this.lineChartData = {
      labels: meses,
      datasets: [
        {
          label: 'Receitas',
          data: receitas,
          borderColor: '#4BC0C0',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        },
        {
          label: 'Despesas',
          data: despesas,
          borderColor: '#FF6384',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }
      ]
    };
  }

  private atualizarGraficoReceitasDespesas(transacoes: TransacaoFinanceira[]) {
    const receitasPorCategoria: Record<string, number> = {};
    const despesasPorCategoria: Record<string, number> = {};

    transacoes.forEach(t => {
      if (t.tipo === 'receita') {
        receitasPorCategoria[t.categoria] = (receitasPorCategoria[t.categoria] || 0) + t.valor;
      } else {
        despesasPorCategoria[t.categoria] = (despesasPorCategoria[t.categoria] || 0) + t.valor;
      }
    });

    const todasCategorias = new Set([
      ...Object.keys(receitasPorCategoria),
      ...Object.keys(despesasPorCategoria)
    ]);

    this.barChartData = {
      labels: Array.from(todasCategorias),
      datasets: [
        {
          label: 'Receitas',
          data: Array.from(todasCategorias).map(cat => receitasPorCategoria[cat] || 0),
          backgroundColor: '#4BC0C0'
        },
        {
          label: 'Despesas',
          data: Array.from(todasCategorias).map(cat => despesasPorCategoria[cat] || 0),
          backgroundColor: '#FF6384'
        }
      ]
    };
  }

  private atualizarGraficoDistribuicaoCategoria(transacoes: TransacaoFinanceira[]) {
    const porCategoria = transacoes.reduce((acc, transacao) => {
      acc[transacao.categoria] = (acc[transacao.categoria] || 0) + transacao.valor;
      return acc;
    }, {} as Record<string, number>);

    this.pieChartData = {
      labels: Object.keys(porCategoria),
      datasets: [{
        data: Object.values(porCategoria),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ]
      }]
    };
  }
}