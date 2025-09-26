import { Routes } from '@angular/router';
import { ProductListComponent } from './pages/products/product-list/product-list.component';

export const routes: Routes = [

  {
    path: 'produtos',
    component: ProductListComponent
  },
  {
    path: '',
    redirectTo: 'produtos',
    pathMatch: 'full'
  }
];
