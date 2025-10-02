import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, throwError, forkJoin } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { User, DashboardStats, WidgetsData, ProductSummary, SaleSummary, RevenueData } from '../models/User';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { SafeStorageService } from './safe-storage.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService extends BaseApiService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public readonly loading$ = this.loadingSubject.asObservable();

  private readonly currentUser = signal<User | null>(null);
  private readonly dashboardStats = signal<DashboardStats | null>(null);
  private readonly widgetsData = signal<WidgetsData | null>(null);
  private readonly topProducts = signal<ProductSummary[]>([]);
  private readonly recentSales = signal<SaleSummary[]>([]);

  constructor(
    protected override http: HttpClient,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly safeStorage: SafeStorageService
  ) {
    super(http);
  }

  /**
   * Adiciona o token JWT aos headers das requisições
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.safeStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      return headers.set('Authorization', `Bearer ${token}`);
    }

    console.warn('Token JWT não encontrado no localStorage');
    return headers;
  }

  /**
   * Opções HTTP com autenticação
   */
  private get authHttpOptions() {
    return {
      headers: this.getAuthHeaders()
    };
  }

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
            throw error;
          })
        );
    } else {
      // Se não há usuário autenticado, retorna erro
      this.loadingSubject.next(false);
      return throwError(() => new Error('Usuário não autenticado'));
    }
  }

  /**
   * Busca estatísticas completas do dashboard
   */
  getDashboardStats(): Observable<DashboardStats> {
    this.loadingSubject.next(true);

    return this.http.get<DashboardStats>(this.buildUrl('dashboard/stats'), this.authHttpOptions)
      .pipe(
        tap(stats => {
          this.dashboardStats.set(stats);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          console.error('Erro ao buscar estatísticas:', error);
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Busca dados otimizados para widgets
   */
  getWidgetsData(): Observable<WidgetsData> {
    return this.http.get<WidgetsData>(this.buildUrl('dashboard/widgets'), this.authHttpOptions)
      .pipe(
        tap(data => {
          this.widgetsData.set(data);
        }),
        catchError(error => {
          console.error('Erro ao buscar dados dos widgets:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Busca produtos mais vendidos
   */
  getTopProducts(count: number = 5): Observable<ProductSummary[]> {
    return this.http.get<ProductSummary[]>(
      this.buildUrl(`dashboard/top-products?count=${count}`),
      this.authHttpOptions
    ).pipe(
      tap(products => {
        this.topProducts.set(products);
      }),
      catchError(error => {
        console.error('Erro ao buscar produtos mais vendidos:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Busca vendas recentes
   */
  getRecentSales(count: number = 5): Observable<SaleSummary[]> {
    return this.http.get<SaleSummary[]>(
      this.buildUrl(`dashboard/recent-sales?count=${count}`),
      this.authHttpOptions
    ).pipe(
      tap(sales => {
        this.recentSales.set(sales);
      }),
      catchError(error => {
        console.error('Erro ao buscar vendas recentes:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Busca receita por período
   */
  getRevenue(inicio: string, fim: string): Observable<RevenueData> {
    return this.http.get<RevenueData>(
      this.buildUrl(`dashboard/revenue?inicio=${inicio}&fim=${fim}`),
      this.authHttpOptions
    ).pipe(
      catchError(error => {
        console.error('Erro ao buscar receita:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Carrega todos os dados do dashboard de uma vez
   */
  loadAllDashboardData(): Observable<any> {
    return forkJoin({
      stats: this.getDashboardStats(),
      widgets: this.getWidgetsData(),
      topProducts: this.getTopProducts(3),
      recentSales: this.getRecentSales(5)
    }).pipe(
      tap(data => {
        this.dashboardStats.set(data.stats);
        this.widgetsData.set(data.widgets);
        this.topProducts.set(data.topProducts);
        this.recentSales.set(data.recentSales);
      }),
      catchError(error => {
        console.error('Erro ao carregar dados do dashboard:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Força atualização de todos os dados
   */
  refreshAllData(): Observable<any> {
    return this.loadAllDashboardData();
  }

  /**
   * Força atualização das estatísticas
   */
  refreshStats(): Observable<DashboardStats> {
    return this.getDashboardStats();
  }

  /**
   * Força atualização dos dados dos widgets
   */
  refreshWidgets(): Observable<WidgetsData> {
    return this.getWidgetsData();
  }

  /**
   * Atualiza informações do usuário
   */
  updateUserInfo(user: Partial<User>): Observable<User> {
    this.loadingSubject.next(true);

    return this.http.put<User>(this.buildUrl('auth/profile'), user, this.authHttpOptions)
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
   * Getters para os signals
   */
  get currentUserSignal() {
    return this.currentUser.asReadonly();
  }

  get dashboardStatsSignal() {
    return this.dashboardStats.asReadonly();
  }

  get widgetsDataSignal() {
    return this.widgetsData.asReadonly();
  }

  get topProductsSignal() {
    return this.topProducts.asReadonly();
  }

  get recentSalesSignal() {
    return this.recentSales.asReadonly();
  }
}
