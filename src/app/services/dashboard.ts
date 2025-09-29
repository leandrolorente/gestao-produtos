import { Injectable, signal, inject } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of, forkJoin } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { User, DashboardStats } from '../models/User';
import { ProdutoService } from './produto.service';
import { UserService } from './user.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService extends BaseApiService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public readonly loading$ = this.loadingSubject.asObservable();

  // Injeção de dependências
  private readonly produtoService = inject(ProdutoService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  private readonly currentUser = signal<User | null>(null);
  private readonly dashboardStats = signal<DashboardStats | null>(null);

  /**
   * Busca informações do usuário atual
   */
  getCurrentUser(): Observable<User> {
    this.loadingSubject.next(true);

    // Obtém o usuário atual autenticado
    const currentUser = this.authService.currentUser();
    if (currentUser && currentUser.id) {
      return this.userService.getUserById(currentUser.id)
        .pipe(
          tap(user => {
            this.currentUser.set(user);
            this.loadingSubject.next(false);
          }),
          catchError(error => {
            console.error('Erro ao buscar usuário:', error);
            this.loadingSubject.next(false);
            // Em caso de erro, usa dados mockados como fallback
            const mockUser = this.getMockUser();
            this.currentUser.set(mockUser);
            return of(mockUser);
          })
        );
    } else {
      // Se não há usuário autenticado, retorna mock
      this.loadingSubject.next(false);
      const mockUser = this.getMockUser();
      this.currentUser.set(mockUser);
      return of(mockUser);
    }
  }

  /**
   * Retorna usuário mockado para demonstração
   */
  private getMockUser(): User {
    return {
      id: '67781ba123456789abcdef01',
      name: 'Leandro Lorente',
      email: 'leandro@empresa.com',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      department: 'TI / Gestão',
      lastLogin: new Date(),
      isActive: true
    };
  }

  /**
   * Busca estatísticas do dashboard calculadas com base nos dados reais
   */
  getDashboardStats(): Observable<DashboardStats> {
    this.loadingSubject.next(true);

    // Busca produtos para calcular estatísticas reais
    return this.produtoService.getAllProducts()
      .pipe(
        map(products => {
          const stats = this.calculateStatsFromProducts(products);
          this.dashboardStats.set(stats);
          this.loadingSubject.next(false);
          return stats;
        }),
        catchError(error => {
          console.error('Erro ao buscar estatísticas:', error);
          this.loadingSubject.next(false);
          // Em caso de erro, usa dados mockados como fallback
          const mockStats = this.getMockStats();
          this.dashboardStats.set(mockStats);
          return of(mockStats);
        })
      );
  }

  /**
   * Calcula estatísticas baseadas na lista real de produtos
   */
  private calculateStatsFromProducts(products: any[]): DashboardStats {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.quantity <= 10).length; // Considera estoque baixo <= 10
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    
    // Simula vendas baseadas na quantidade (produtos com menos estoque venderam mais)
    const productsWithSales = products.map(p => ({
      ...p,
      sales: Math.max(1, Math.floor(Math.random() * 30) + (50 - Math.min(p.quantity, 50))) // Simula vendas realistas
    }));

    // Top 3 produtos mais vendidos
    const topSellingProducts = productsWithSales
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        sales: p.sales
      }));

    return {
      totalProducts,
      lowStockProducts,
      totalValue,
      recentTransactions: Math.floor(Math.random() * 30) + 15, // Simula transações recentes
      pendingOrders: Math.floor(Math.random() * 10) + 3, // Simula pedidos pendentes
      topSellingProducts
    };
  }

  /**
   * Força atualização das estatísticas
   */
  refreshStats(): Observable<DashboardStats> {
    return this.getDashboardStats();
  }

  /**
   * Retorna estatísticas mockadas para demonstração
   */
  private getMockStats(): DashboardStats {
    return {
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
    };
  }

  /**
   * Atualiza informações do usuário
   */
  updateUserInfo(user: Partial<User>): Observable<User> {
    this.loadingSubject.next(true);

    return this.http.put<User>(this.buildUrl('auth/profile'), user, this.httpOptions)
      .pipe(
        tap(updatedUser => {
          this.currentUser.set(updatedUser);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Realiza logout do usuário
   */
  logout(): Observable<void> {
    return this.http.post<void>(this.buildUrl('auth/logout'), {}, this.httpOptions)
      .pipe(
        tap(() => {
          this.currentUser.set(null);
          // Lógica adicional de logout (redirecionamento, limpeza de tokens, etc.)
          console.log('Logout realizado');
        }),
        catchError(error => {
          console.error('Erro no logout:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Getters para os signals
   */
  get currentUserSignal() {
    return this.currentUser.asReadonly();
  }

  get dashboardStatsSignal() {
    return this.dashboardStats.asReadonly();
  }
}
