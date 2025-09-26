import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  isOpen = input<boolean>(false);
  closeSidebar = output<void>();
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'Produtos',
      icon: 'inventory',
      route: '/produtos'
    },
    {
      label: 'Clientes',
      icon: 'people',
      route: '/clientes'
    },
    {
      label: 'Estoque',
      icon: 'warehouse',
      route: '/estoque',
      badge: 12
    },
    {
      label: 'Vendas',
      icon: 'point_of_sale',
      route: '/vendas'
    },
    {
      label: 'Relatórios',
      icon: 'analytics',
      route: '/relatorios',
      children: [
        { label: 'Vendas', icon: 'trending_up', route: '/relatorios/vendas' },
        { label: 'Estoque', icon: 'inventory_2', route: '/relatorios/estoque' },
        { label: 'Financeiro', icon: 'account_balance', route: '/relatorios/financeiro' }
      ]
    },
    {
      label: 'Fornecedores',
      icon: 'business',
      route: '/fornecedores'
    },
    {
      label: 'Usuários',
      icon: 'people',
      route: '/usuarios'
    },
    {
      label: 'Configurações',
      icon: 'settings',
      route: '/configuracoes'
    }
  ];

  expandedItems: Set<string> = new Set();

  toggleExpanded(item: MenuItem) {
    if (item.children) {
      if (this.expandedItems.has(item.label)) {
        this.expandedItems.delete(item.label);
      } else {
        this.expandedItems.add(item.label);
      }
    }
  }

  isExpanded(item: MenuItem): boolean {
    return this.expandedItems.has(item.label);
  }

  protected onItemClick(): void {
    // Fecha a sidebar no mobile após clique
    if (window.innerWidth <= 768) {
      this.closeSidebar.emit();
    }
  }
}
