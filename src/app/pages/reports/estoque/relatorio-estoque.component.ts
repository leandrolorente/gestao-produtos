// src/app/pages/reports/estoque/relatorio-estoque.component.ts
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

interface MovimentacaoEstoque {
  id: string;
  produto: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  motivo: string;
  data: Date;
  usuario: string;
}

interface ResumoEstoque {
  totalMovimentacoes: number;
  entradas: number;
  saidas: number;
  produtosBaixoEstoque: number;
}

@Component({
  selector: 'app-relatorio-estoque',
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
  templateUrl: './relatorio-estoque.component.html',
  styleUrl: './relatorio-estoque.component.scss'
})
export class RelatorioEstoqueComponent implements OnInit {
  protected carregando = signal(false);
  protected movimentacoes = signal<MovimentacaoEstoque[]>([]);
  protected resumo = signal<ResumoEstoque>({
    totalMovimentacoes: 0,
    entradas: 0,
    saidas: 0,
    produtosBaixoEstoque: 0
  });

  protected filtrosAplicados = signal<FiltroRelatorio[]>([]);
  protected displayedColumns: string[] = ['produto', 'tipo', 'quantidade', 'motivo', 'data', 'usuario'];

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
      title: { display: true, text: 'Movimentações por Período' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  protected barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Produtos com Mais Movimentações' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  protected pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Tipo de Movimentações' }
    }
  };

  constructor(private relatorioService: RelatorioService) {}

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.carregando.set(true);

    // Primeiro carregamos os dados dos produtos para gerar as movimentações
    this.relatorioService.getDadosProdutos().subscribe({
      next: (dadosProdutos: any[]) => {
        // Gerar movimentações fictícias baseadas nos produtos
        const movimentacoesGeradas = this.gerarMovimentacoesFicticias(dadosProdutos);
        this.movimentacoes.set(movimentacoesGeradas);
        this.atualizarResumo(movimentacoesGeradas);
        this.atualizarGraficos(movimentacoesGeradas);
        this.carregando.set(false);
      },
      error: (error: any) => {
        console.error('Erro ao carregar dados do estoque:', error);
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros(filtros: FiltroRelatorio[]) {
    this.filtrosAplicados.set(filtros);
    this.carregarDados();
  }

  exportarCSV() {
    const dados = this.movimentacoes();
    if (dados.length === 0) return;

    const headers = ['Produto', 'Tipo', 'Quantidade', 'Motivo', 'Data', 'Usuário'];
    const csvContent = [
      headers.join(','),
      ...dados.map(mov => [
        mov.produto,
        mov.tipo,
        mov.quantidade,
        mov.motivo,
        mov.data.toLocaleDateString('pt-BR'),
        mov.usuario
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-estoque-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  private gerarMovimentacoesFicticias(produtos: any[]): MovimentacaoEstoque[] {
    const movimentacoes: MovimentacaoEstoque[] = [];
    const tipos: ('entrada' | 'saida')[] = ['entrada', 'saida'];
    const motivos = ['Compra', 'Venda', 'Ajuste', 'Devolução', 'Transferência'];
    const usuarios = ['Admin', 'Vendedor 1', 'Estoquista', 'Gerente'];

    // Gerar movimentações para os últimos 30 dias
    const agora = new Date();
    for (let i = 0; i < 30; i++) {
      const data = new Date(agora);
      data.setDate(data.getDate() - i);

      // Gerar 2-5 movimentações por dia
      const numMovimentacoes = Math.floor(Math.random() * 4) + 2;

      for (let j = 0; j < numMovimentacoes; j++) {
        const produto = produtos[Math.floor(Math.random() * produtos.length)];
        const tipo = tipos[Math.floor(Math.random() * tipos.length)];

        movimentacoes.push({
          id: `mov_${i}_${j}`,
          produto: produto.nome,
          tipo,
          quantidade: Math.floor(Math.random() * 20) + 1,
          motivo: motivos[Math.floor(Math.random() * motivos.length)],
          data,
          usuario: usuarios[Math.floor(Math.random() * usuarios.length)]
        });
      }
    }

    return movimentacoes.sort((a, b) => b.data.getTime() - a.data.getTime());
  }

  private atualizarResumo(movimentacoes: MovimentacaoEstoque[]) {
    const entradas = movimentacoes.filter(m => m.tipo === 'entrada').length;
    const saidas = movimentacoes.filter(m => m.tipo === 'saida').length;

    this.resumo.set({
      totalMovimentacoes: movimentacoes.length,
      entradas,
      saidas,
      produtosBaixoEstoque: 0 // Será calculado com base nos dados dos produtos
    });
  }

  private atualizarGraficos(movimentacoes: MovimentacaoEstoque[]) {
    this.atualizarGraficoMovimentacoesPorPeriodo(movimentacoes);
    this.atualizarGraficoProdutosMaisMovimentados(movimentacoes);
    this.atualizarGraficoTipoMovimentacoes(movimentacoes);
  }

  private atualizarGraficoMovimentacoesPorPeriodo(movimentacoes: MovimentacaoEstoque[]) {
    const agora = new Date();
    const dias = [];
    const entradas = [];
    const saidas = [];

    for (let i = 29; i >= 0; i--) {
      const dia = new Date(agora);
      dia.setDate(dia.getDate() - i);

      const movimentacoesDoDia = movimentacoes.filter(m =>
        m.data.toDateString() === dia.toDateString()
      );

      const entradasDoDia = movimentacoesDoDia.filter(m => m.tipo === 'entrada').length;
      const saidasDoDia = movimentacoesDoDia.filter(m => m.tipo === 'saida').length;

      dias.push(dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
      entradas.push(entradasDoDia);
      saidas.push(saidasDoDia);
    }

    this.lineChartData = {
      labels: dias,
      datasets: [
        {
          label: 'Entradas',
          data: entradas,
          borderColor: '#4BC0C0',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        },
        {
          label: 'Saídas',
          data: saidas,
          borderColor: '#FF6384',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }
      ]
    };
  }

  private atualizarGraficoProdutosMaisMovimentados(movimentacoes: MovimentacaoEstoque[]) {
    const produtosMovimentados: Record<string, number> = {};

    movimentacoes.forEach(mov => {
      produtosMovimentados[mov.produto] = (produtosMovimentados[mov.produto] || 0) + 1;
    });

    const topProdutos = Object.entries(produtosMovimentados)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    this.barChartData = {
      labels: topProdutos.map(([produto]) => produto),
      datasets: [{
        label: 'Movimentações',
        data: topProdutos.map(([,quantidade]) => quantidade),
        backgroundColor: '#36A2EB'
      }]
    };
  }

  private atualizarGraficoTipoMovimentacoes(movimentacoes: MovimentacaoEstoque[]) {
    const porTipo = movimentacoes.reduce((acc, mov) => {
      acc[mov.tipo] = (acc[mov.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.pieChartData = {
      labels: Object.keys(porTipo),
      datasets: [{
        data: Object.values(porTipo),
        backgroundColor: ['#4BC0C0', '#FF6384']
      }]
    };
  }
}
