import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ProductListComponent } from './pages/products/product-list/product-list.component';
import { ClientListComponent } from './pages/clients/client-list/client-list';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
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
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
