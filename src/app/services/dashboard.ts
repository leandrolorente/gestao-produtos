import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { User, DashboardStats } from '../models/User';

@Injectable({
  providedIn: 'root'
})
export class DashboardService extends BaseApiService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public readonly loading$ = this.loadingSubject.asObservable();

  // Usuário mockado para demonstração (comentado para uso posterior se necessário)
  /*
  private readonly MOCK_USER: User = {
    id: 1,
    name: 'Leandro Lorente',
    email: 'leandro@empresa.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
    department: 'TI / Gestão',
    lastLogin: new Date(),
    isActive: true
  };
  */

  // Stats mockadas para demonstração (comentadas para uso posterior se necessário)
  /*
  private readonly MOCK_STATS: DashboardStats = {
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
  */

  private readonly currentUser = signal<User | null>(null);
  private readonly dashboardStats = signal<DashboardStats | null>(null);

  /**
   * Busca informações do usuário atual
   */
  getCurrentUser(): Observable<User> {
    this.loadingSubject.next(true);

    return this.http.get<User>(this.buildUrl('auth/me'), this.httpOptions)
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
   * Busca estatísticas do dashboard
   */
  getDashboardStats(): Observable<DashboardStats> {
    this.loadingSubject.next(true);

    return this.http.get<DashboardStats>(this.buildUrl('dashboard/stats'), this.httpOptions)
      .pipe(
        tap(stats => {
          this.dashboardStats.set(stats);
          this.loadingSubject.next(false);
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
   * Força atualização das estatísticas
   */
  refreshStats(): Observable<DashboardStats> {
    return this.getDashboardStats();
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
