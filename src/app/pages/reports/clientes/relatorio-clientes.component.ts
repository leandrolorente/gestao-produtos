import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

import { FiltrosRelatorioComponent } from '../../../components/filtros-relatorio/filtros-relatorio.component';
import { RelatorioService, FiltroRelatorio } from '../../../services/relatorio.service';

interface ClienteRelatorio {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  tipo: 'PF' | 'PJ';
  cidade: string;
  estado: string;
  dataCadastro: Date;
  status: 'ativo' | 'inativo';
}

interface ResumoClientes {
  totalClientes: number;
  clientesAtivos: number;
  clientesInativos: number;
  novosMes: number;
}

@Component({
  selector: 'app-relatorio-clientes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    FiltrosRelatorioComponent
  ],
  templateUrl: './relatorio-clientes.component.html',
  styleUrls: ['./relatorio-clientes.component.scss']
})
export class RelatorioClientesComponent implements OnInit {
  protected loading = signal(false);
  protected clientes = signal<ClienteRelatorio[]>([]);
  protected resumo = signal<ResumoClientes>({
    totalClientes: 0,
    clientesAtivos: 0,
    clientesInativos: 0,
    novosMes: 0
  });

  protected filtrosAplicados = signal<FiltroRelatorio[]>([]);

  protected displayedColumns: string[] = ['nome', 'email', 'telefone', 'tipo', 'cidade', 'estado', 'status'];

  // Configurações dos gráficos
  protected pieChartType: ChartType = 'pie';
  protected barChartType: ChartType = 'bar';
  protected lineChartType: ChartType = 'line';

  protected pieChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };

  protected barChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };

  protected lineChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };

  protected pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Clientes por Tipo'
      }
    }
  };

  protected barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Clientes por Estado'
      }
    }
  };

  protected lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Crescimento de Clientes'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  constructor(private relatorioService: RelatorioService) {}

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.loading.set(true);
    
    this.relatorioService.getDadosClientes().subscribe({
      next: (dados: any[]) => {
        const clientesProcessados = this.processarDadosClientes(dados);
        this.clientes.set(clientesProcessados);
        this.atualizarResumo(clientesProcessados);
        this.atualizarGraficos(clientesProcessados);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar dados dos clientes:', error);
        this.loading.set(false);
      }
    });
  }

  aplicarFiltros(filtros: FiltroRelatorio[]) {
    this.filtrosAplicados.set(filtros);
    this.carregarDados();
  }

  exportarCSV() {
    const dados = this.clientes();
    if (dados.length === 0) return;

    const headers = ['Nome', 'Email', 'Telefone', 'Tipo', 'Cidade', 'Estado', 'Status', 'Data Cadastro'];
    const csvContent = [
      headers.join(','),
      ...dados.map(cliente => [
        cliente.nome,
        cliente.email,
        cliente.telefone,
        cliente.tipo,
        cliente.cidade,
        cliente.estado,
        cliente.status,
        cliente.dataCadastro.toLocaleDateString('pt-BR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-clientes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  private processarDadosClientes(dados: any[]): ClienteRelatorio[] {
    return dados.map(cliente => ({
      id: cliente._id || cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      tipo: cliente.cpf ? 'PF' : 'PJ',
      cidade: cliente.endereco?.cidade || cliente.localizacao?.cidade || 'N/A',
      estado: cliente.endereco?.estado || cliente.localizacao?.estado || 'N/A',
      dataCadastro: new Date(cliente.dataCadastro || cliente.createdAt || Date.now()),
      status: cliente.status || 'ativo'
    }));
  }

  private atualizarResumo(clientes: ClienteRelatorio[]) {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    
    const clientesAtivos = clientes.filter(c => c.status === 'ativo').length;
    const novosMes = clientes.filter(c => c.dataCadastro >= inicioMes).length;

    this.resumo.set({
      totalClientes: clientes.length,
      clientesAtivos,
      clientesInativos: clientes.length - clientesAtivos,
      novosMes
    });
  }

  private atualizarGraficos(clientes: ClienteRelatorio[]) {
    this.atualizarGraficoPorTipo(clientes);
    this.atualizarGraficoPorEstado(clientes);
    this.atualizarGraficoCrescimento(clientes);
  }

  private atualizarGraficoPorTipo(clientes: ClienteRelatorio[]) {
    const porTipo = clientes.reduce((acc, cliente) => {
      acc[cliente.tipo] = (acc[cliente.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.pieChartData = {
      labels: Object.keys(porTipo),
      datasets: [{
        data: Object.values(porTipo),
        backgroundColor: ['#FF6384', '#36A2EB'],
      }]
    };
  }

  private atualizarGraficoPorEstado(clientes: ClienteRelatorio[]) {
    const porEstado = clientes.reduce((acc, cliente) => {
      if (cliente.estado !== 'N/A') {
        acc[cliente.estado] = (acc[cliente.estado] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Pegar top 10 estados
    const topEstados = Object.entries(porEstado)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    this.barChartData = {
      labels: topEstados.map(([estado]) => estado),
      datasets: [{
        label: 'Clientes',
        data: topEstados.map(([,quantidade]) => quantidade),
        backgroundColor: '#36A2EB',
      }]
    };
  }

  private atualizarGraficoCrescimento(clientes: ClienteRelatorio[]) {
    const agora = new Date();
    const meses = [];
    const dados = [];
    
    for (let i = 11; i >= 0; i--) {
      const mes = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const proximoMes = new Date(agora.getFullYear(), agora.getMonth() - i + 1, 1);
      
      const clientesNoMes = clientes.filter(c => 
        c.dataCadastro >= mes && c.dataCadastro < proximoMes
      ).length;
      
      meses.push(mes.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
      dados.push(clientesNoMes);
    }

    this.lineChartData = {
      labels: meses,
      datasets: [{
        label: 'Novos Clientes',
        data: dados,
        borderColor: '#FF6384',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      }]
    };
  }
}