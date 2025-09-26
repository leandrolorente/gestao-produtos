import { Injectable, signal } from '@angular/core';
import { User, DashboardStats } from '../models/User';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // Usuário mockado para demonstração
  private readonly currentUser = signal<User>({
    id: 1,
    name: 'Leandro Lorente',
    email: 'leandro@empresa.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
    department: 'TI / Gestão',
    lastLogin: new Date(),
    isActive: true
  });

  // Stats mockadas para demonstração
  private readonly dashboardStats = signal<DashboardStats>({
    totalProducts: 156,
    lowStockProducts: 12,
    totalValue: 89750.50,
    recentTransactions: 47,
    pendingOrders: 8,
    topSellingProducts: [
      { id: 1, name: 'Teclado Mecânico RGB', quantity: 50, sales: 23 },
      { id: 2, name: 'Mouse Gamer 16000 DPI', quantity: 75, sales: 18 },
      { id: 3, name: 'Monitor Ultrawide 29"', quantity: 20, sales: 15 }
    ]
  });

  constructor() { }

  getCurrentUser() {
    return this.currentUser.asReadonly();
  }

  getDashboardStats() {
    return this.dashboardStats.asReadonly();
  }

  updateUserInfo(user: Partial<User>) {
    this.currentUser.update(current => ({ ...current, ...user }));
  }

  logout() {
    // Lógica de logout (redirecionamento, limpeza de tokens, etc.)
    console.log('Logout realizado');
  }
}
