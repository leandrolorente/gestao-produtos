// src/app/pages/reports/produtos/relatorio-produtos.component.ts
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

interface ProdutoRelatorio {
  id: string;
  codigo: string;
  nome: string;
  categoria: string;
  preco: number;
  quantidade: number;
  estoqueMinimo: number;
  dataUltimaMovimentacao: Date;
  status: 'ativo' | 'inativo';
}

interface ResumoProdutos {
  totalProdutos: number;
  totalEstoque: number;
  produtosBaixoEstoque: number;
  valorTotalEstoque: number;
}

@Component({
  selector: 'app-relatorio-produtos',
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
  templateUrl: './relatorio-produtos.component.html',
  styleUrl: './relatorio-produtos.component.scss'
})
export class RelatorioProdutosComponent implements OnInit {
  protected carregando = signal(false);
  protected produtos = signal<ProdutoRelatorio[]>([]);
  protected resumo = signal<ResumoProdutos>({
    totalProdutos: 0,
    totalEstoque: 0,
    produtosBaixoEstoque: 0,
    valorTotalEstoque: 0
  });

  protected filtrosAplicados = signal<FiltroRelatorio[]>([]);
  protected displayedColumns: string[] = ['codigo', 'nome', 'categoria', 'preco', 'quantidade', 'status'];

  // Configurações dos gráficos
  protected pieChartType: ChartType = 'pie';
  protected barChartType: ChartType = 'bar';
  protected doughnutChartType: ChartType = 'doughnut';

  protected pieChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };

  protected barChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };

  protected doughnutChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };

  protected pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Produtos por Categoria' }
    }
  };

  protected barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Estoque por Categoria' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  protected doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Valor do Estoque por Categoria' }
    }
  };

  constructor(private relatorioService: RelatorioService) {}

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.carregando.set(true);
    
    this.relatorioService.getDadosProdutos().subscribe({
      next: (dados: any[]) => {
        const produtosProcessados = this.processarDadosProdutos(dados);
        this.produtos.set(produtosProcessados);
        this.atualizarResumo(produtosProcessados);
        this.atualizarGraficos(produtosProcessados);
        this.carregando.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar dados dos produtos:', error);
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros(filtros: FiltroRelatorio[]) {
    this.filtrosAplicados.set(filtros);
    this.carregarDados();
  }

  exportarCSV() {
    const dados = this.produtos();
    if (dados.length === 0) return;

    const headers = ['Código', 'Nome', 'Categoria', 'Preço', 'Quantidade', 'Estoque Mínimo', 'Status'];
    const csvContent = [
      headers.join(','),
      ...dados.map(produto => [
        produto.codigo,
        produto.nome,
        produto.categoria,
        produto.preco.toFixed(2),
        produto.quantidade,
        produto.estoqueMinimo,
        produto.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-produtos-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  private processarDadosProdutos(dados: any[]): ProdutoRelatorio[] {
    return dados.map(produto => ({
      id: produto._id || produto.id,
      codigo: produto.codigo || 'N/A',
      nome: produto.nome,
      categoria: produto.categoria || 'Geral',
      preco: parseFloat(produto.preco) || 0,
      quantidade: parseInt(produto.quantidade) || 0,
      estoqueMinimo: parseInt(produto.estoqueMinimo) || 0,
      dataUltimaMovimentacao: new Date(produto.ultimaMovimentacao || produto.updatedAt || Date.now()),
      status: produto.status || 'ativo'
    }));
  }

  private atualizarResumo(produtos: ProdutoRelatorio[]) {
    const totalEstoque = produtos.reduce((sum, p) => sum + p.quantidade, 0);
    const produtosBaixoEstoque = produtos.filter(p => p.quantidade <= p.estoqueMinimo).length;
    const valorTotalEstoque = produtos.reduce((sum, p) => sum + (p.preco * p.quantidade), 0);

    this.resumo.set({
      totalProdutos: produtos.length,
      totalEstoque,
      produtosBaixoEstoque,
      valorTotalEstoque
    });
  }

  private atualizarGraficos(produtos: ProdutoRelatorio[]) {
    this.atualizarGraficoPorCategoria(produtos);
    this.atualizarGraficoEstoquePorCategoria(produtos);
    this.atualizarGraficoValorPorCategoria(produtos);
  }

  private atualizarGraficoPorCategoria(produtos: ProdutoRelatorio[]) {
    const porCategoria = produtos.reduce((acc, produto) => {
      acc[produto.categoria] = (acc[produto.categoria] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.pieChartData = {
      labels: Object.keys(porCategoria),
      datasets: [{
        data: Object.values(porCategoria),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
      }]
    };
  }

  private atualizarGraficoEstoquePorCategoria(produtos: ProdutoRelatorio[]) {
    const estoquePorCategoria = produtos.reduce((acc, produto) => {
      acc[produto.categoria] = (acc[produto.categoria] || 0) + produto.quantidade;
      return acc;
    }, {} as Record<string, number>);

    this.barChartData = {
      labels: Object.keys(estoquePorCategoria),
      datasets: [{
        label: 'Quantidade em Estoque',
        data: Object.values(estoquePorCategoria),
        backgroundColor: '#36A2EB'
      }]
    };
  }

  private atualizarGraficoValorPorCategoria(produtos: ProdutoRelatorio[]) {
    const valorPorCategoria = produtos.reduce((acc, produto) => {
      acc[produto.categoria] = (acc[produto.categoria] || 0) + (produto.preco * produto.quantidade);
      return acc;
    }, {} as Record<string, number>);

    this.doughnutChartData = {
      labels: Object.keys(valorPorCategoria),
      datasets: [{
        data: Object.values(valorPorCategoria),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
      }]
    };
  }
}