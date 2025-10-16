import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductListComponent } from './pages/products/product-list/product-list.component';
import { ClientListComponent } from './pages/clients/client-list/client-list.component';
import { UserListComponent } from './pages/users/user-list/user-list.component';
import { VendaListComponent } from './pages/vendas/venda-list/venda-list.component';
import { FornecedorListComponent } from './pages/fornecedores/fornecedor-list/fornecedor-list.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard, loginGuard } from './guards/auth.guard';

// Importações dos componentes de relatórios
import { RelatorioClientesComponent } from './pages/reports/clientes/relatorio-clientes.component';
import { RelatorioProdutosComponent } from './pages/reports/produtos/relatorio-produtos.component';
import { RelatorioVendasComponent } from './pages/reports/vendas/relatorio-vendas.component';
import { RelatorioEstoqueComponent } from './pages/reports/estoque/relatorio-estoque.component';
import { RelatorioFinanceiroComponent } from './pages/reports/financeiro/relatorio-financeiro.component';

export const routes: Routes = [
  // Rota de login (sem layout)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard]
  },
  // Rotas protegidas com layout
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'produtos',
        component: ProductListComponent
      },
      {
        path: 'clientes',
        component: ClientListComponent
      },
      {
        path: 'vendas',
        component: VendaListComponent
      },
      {
        path: 'fornecedores',
        component: FornecedorListComponent
      },
      {
        path: 'contas-pagar',
        loadComponent: () => import('./pages/contas-pagar/conta-pagar-list/conta-pagar-list.component').then(m => m.ContaPagarListComponent)
      },
      {
        path: 'contas-receber',
        loadComponent: () => import('./pages/contas-receber/conta-receber-list/conta-receber-list.component').then(m => m.ContaReceberListComponent)
      },
      {
        path: 'usuarios',
        component: UserListComponent
      },
      // Rotas de relatórios
      {
        path: 'relatorios/clientes',
        component: RelatorioClientesComponent
      },
      {
        path: 'relatorios/produtos',
        component: RelatorioProdutosComponent
      },
      {
        path: 'relatorios/vendas',
        component: RelatorioVendasComponent
      },
      {
        path: 'relatorios/estoque',
        component: RelatorioEstoqueComponent
      },
      {
        path: 'relatorios/financeiro',
        component: RelatorioFinanceiroComponent
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  // Rota wildcard - redireciona para login
  {
    path: '**',
    redirectTo: 'login'
  }
];
