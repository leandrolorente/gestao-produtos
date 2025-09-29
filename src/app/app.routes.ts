import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductListComponent } from './pages/products/product-list/product-list.component';
import { ClientListComponent } from './pages/clients/client-list/client-list.component';
import { UserListComponent } from './pages/users/user-list/user-list.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard, loginGuard } from './guards/auth.guard';

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
        path: 'usuarios',
        component: UserListComponent
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
