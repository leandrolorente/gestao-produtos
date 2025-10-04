// src/app/pages/reports/vendas/relatorio-vendas.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ChartConfiguration, ChartType } from 'chart.js';

import { RelatorioService } from '../../../services/relatorio.service';
import { FiltrosRelatorioComponent, CampoFiltro } from '../../../components/filtros-relatorio/filtros-relatorio.component';
import { FiltroRelatorio } from '../../../models/FiltroRelatorio';

interface VendaRelatorio {
  id: string;
  numero: string;
  cliente: string;
  data: Date;
  valor: number;
  status: 'finalizada' | 'pendente' | 'cancelada';
  itens: any[];
}

interface ResumoVendas {
  totalVendas: number;
  faturamentoTotal: number;
  ticketMedio: number;
}

@Component({
  selector: 'app-relatorio-vendas',
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
  templateUrl: './relatorio-vendas.component.html',
  styleUrl: './relatorio-vendas.component.scss'
})
export class RelatorioVendasComponent implements OnInit {
  protected carregando = signal(false);
  protected vendas = signal<VendaRelatorio[]>([]);
  protected resumo = signal<ResumoVendas>({
    totalVendas: 0,
    faturamentoTotal: 0,
    ticketMedio: 0
  });

  protected filtrosAplicados = signal<FiltroRelatorio[]>([]);
  protected camposFiltro: CampoFiltro[] = [
    {
      nome: 'numero',
      label: 'Número da Venda',
      tipo: 'text'
    },
    {
      nome: 'cliente',
      label: 'Cliente',
      tipo: 'text'
    },
    {
      nome: 'status',
      label: 'Status',
      tipo: 'select',
      opcoes: [
        { valor: 'finalizada', label: 'Finalizada' },
        { valor: 'pendente', label: 'Pendente' },
        { valor: 'cancelada', label: 'Cancelada' }
      ]
    },
    {
      nome: 'valorMinimo',
      label: 'Valor Mínimo',
      tipo: 'number'
    },
    {
      nome: 'valorMaximo',
      label: 'Valor Máximo',
      tipo: 'number'
    }
  ];
  protected displayedColumns: string[] = ['numero', 'cliente', 'data', 'valor', 'status'];

  constructor(private relatorioService: RelatorioService) {}

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.carregando.set(true);

    this.relatorioService.getDadosVendas().subscribe({
      next: (dados: any[]) => {
        let vendasProcessadas = this.processarDadosVendas(dados);

        // Aplicar filtros se existirem
        if (this.filtrosAplicados().length > 0) {
          vendasProcessadas = this.aplicarFiltrosNaListagem(vendasProcessadas);
        }

        this.vendas.set(vendasProcessadas);
        this.atualizarResumo(vendasProcessadas);
        this.carregando.set(false);
      },
      error: (error: any) => {
        console.error('Erro ao carregar dados das vendas:', error);
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros(filtros: FiltroRelatorio[]) {
    this.filtrosAplicados.set(filtros);
    this.carregarDados();
  }

  gerarRelatorio() {
    this.carregarDados();
  }

  private aplicarFiltrosNaListagem(vendas: VendaRelatorio[]): VendaRelatorio[] {
    let vendasFiltradas = [...vendas];

    this.filtrosAplicados().forEach(filtro => {
      switch (filtro.campo) {
        case 'dataInicio':
          if (filtro.valor) {
            const dataInicio = new Date(filtro.valor);
            vendasFiltradas = vendasFiltradas.filter(v => v.data >= dataInicio);
          }
          break;
        case 'dataFim':
          if (filtro.valor) {
            const dataFim = new Date(filtro.valor);
            dataFim.setHours(23, 59, 59, 999);
            vendasFiltradas = vendasFiltradas.filter(v => v.data <= dataFim);
          }
          break;
        case 'numero':
          if (filtro.valor) {
            vendasFiltradas = vendasFiltradas.filter(v =>
              v.numero.toLowerCase().includes(filtro.valor!.toLowerCase())
            );
          }
          break;
        case 'cliente':
          if (filtro.valor) {
            vendasFiltradas = vendasFiltradas.filter(v =>
              v.cliente.toLowerCase().includes(filtro.valor!.toLowerCase())
            );
          }
          break;
        case 'status':
          if (filtro.valor) {
            vendasFiltradas = vendasFiltradas.filter(v => v.status === filtro.valor);
          }
          break;
        case 'valorMinimo':
          if (filtro.valor) {
            const valorMin = parseFloat(filtro.valor);
            vendasFiltradas = vendasFiltradas.filter(v => v.valor >= valorMin);
          }
          break;
        case 'valorMaximo':
          if (filtro.valor) {
            const valorMax = parseFloat(filtro.valor);
            vendasFiltradas = vendasFiltradas.filter(v => v.valor <= valorMax);
          }
          break;
      }
    });

    return vendasFiltradas;
  }

  exportarCSV() {
    const dados = this.vendas();
    if (dados.length === 0) return;

    const headers = ['Número', 'Cliente', 'Data', 'Valor', 'Status'];
    const csvContent = [
      headers.join(','),
      ...dados.map(venda => [
        venda.numero,
        venda.cliente,
        venda.data.toLocaleDateString('pt-BR'),
        venda.valor.toFixed(2),
        venda.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-vendas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  private processarDadosVendas(dados: any[]): VendaRelatorio[] {
    return dados.map((venda, index) => ({
      id: venda._id || venda.id || `venda_${index}`,
      numero: venda.numero || `VD${String(index + 1).padStart(4, '0')}`,
      cliente: venda.cliente || venda.nomeCliente || 'Cliente Não Informado',
      data: new Date(venda.data || venda.dataVenda || venda.createdAt || Date.now()),
      valor: parseFloat(venda.valor) || parseFloat(venda.total) || 0,
      status: venda.status || 'finalizada',
      itens: venda.itens || []
    }));
  }

  private atualizarResumo(vendas: VendaRelatorio[]) {
    const faturamentoTotal = vendas.reduce((sum, v) => sum + v.valor, 0);
    const ticketMedio = vendas.length > 0 ? faturamentoTotal / vendas.length : 0;

    this.resumo.set({
      totalVendas: vendas.length,
      faturamentoTotal,
      ticketMedio
    });
  }
}
