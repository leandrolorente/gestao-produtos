import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { DashboardStats, User, WidgetsData, ProductSummary, SaleSummary } from '../../models/User';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);

  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly widgets = signal<WidgetsData | null>(null);
  protected readonly topProducts = signal<ProductSummary[]>([]);
  protected readonly recentSales = signal<SaleSummary[]>([]);
  protected readonly user = signal<User | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isRefreshing = signal(false);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Carrega dados do dashboard (usuário e estatísticas)
   */
  protected loadDashboardData(): void {
    this.isLoading.set(true);

    // Carrega usuário atual
    this.dashboardService.getCurrentUser().subscribe({
      next: (user) => {
        this.user.set(user);
      },
      error: (error) => {
        console.error('Erro ao carregar usuário:', error);
        this.authService.showSnackbar('Erro ao carregar dados do usuário', 'error');
      }
    });

    // Carrega todos os dados do dashboard de uma vez
    this.dashboardService.loadAllDashboardData().subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        this.widgets.set(data.widgets);
        this.topProducts.set(data.topProducts);
        this.recentSales.set(data.recentSales);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar dados do dashboard:', error);
        this.authService.showSnackbar('Erro ao carregar dados do dashboard', 'error');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Força atualização dos dados
   */
  protected refreshData(): void {
    this.loadDashboardData();
  }

  /**
   * Força atualização de todos os dados do dashboard
   */
  protected refreshStats(): void {
    this.isRefreshing.set(true);
    this.dashboardService.refreshAllData().subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        this.widgets.set(data.widgets);
        this.topProducts.set(data.topProducts);
        this.recentSales.set(data.recentSales);
        this.isRefreshing.set(false);
        this.authService.showSnackbar('Dashboard atualizado com sucesso!', 'success');
      },
      error: (error) => {
        console.error('Erro ao atualizar dashboard:', error);
        this.isRefreshing.set(false);
        this.authService.showSnackbar('Erro ao atualizar dashboard', 'error');
      }
    });
  }

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
