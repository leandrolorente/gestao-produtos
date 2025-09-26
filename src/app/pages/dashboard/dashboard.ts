import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { DashboardService } from '../../services/dashboard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  private dashboardService = inject(DashboardService);

  protected readonly stats = this.dashboardService.getDashboardStats();
  protected readonly user = this.dashboardService.getCurrentUser();

  protected readonly quickActions = [
    {
      title: 'Gerenciar Produtos',
      description: 'Adicionar, editar ou remover produtos',
      icon: 'inventory',
      route: '/produtos',
      color: 'primary'
    },
    {
      title: 'Gerenciar Clientes',
      description: 'Cadastrar e gerenciar clientes',
      icon: 'people',
      route: '/clientes',
      color: 'accent'
    },
    {
      title: 'Controle de Estoque',
      description: 'Monitorar níveis de estoque',
      icon: 'warehouse',
      route: '/estoque',
      color: 'primary'
    },
    {
      title: 'Registrar Vendas',
      description: 'Processar vendas e pedidos',
      icon: 'point_of_sale',
      route: '/vendas',
      color: 'accent'
    },
    {
      title: 'Relatórios',
      description: 'Visualizar relatórios detalhados',
      icon: 'analytics',
      route: '/relatorios',
      color: 'primary'
    },
    {
      title: 'Fornecedores',
      description: 'Gerenciar fornecedores',
      icon: 'business',
      route: '/fornecedores',
      color: 'primary'
    },
    {
      title: 'Usuários',
      description: 'Administrar usuários do sistema',
      icon: 'people',
      route: '/usuarios',
      color: 'warn'
    },
    {
      title: 'Novo Produto',
      description: 'Cadastrar um novo produto',
      icon: 'add_circle',
      route: '/produtos',
      color: 'accent'
    },
    {
      title: 'Configurações',
      description: 'Ajustar configurações do sistema',
      icon: 'settings',
      route: '/configuracoes',
      color: 'primary'
    }
  ];

  protected getStockLevel(quantity: number): string {
    if (quantity <= 5) return 'low';
    if (quantity <= 20) return 'medium';
    return 'high';
  }
}
