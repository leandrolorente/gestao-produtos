import { Injectable, signal, inject } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthUser {
  id: string; // Mudado para string para compatibilidade com MongoDB ObjectId
  name: string;
  email: string;
  avatar?: string;
  department: string;
  role: 'admin' | 'manager' | 'user';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseApiService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public readonly loading$ = this.loadingSubject.asObservable();

  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  // Signal para o usuário atual
  private readonly currentUserSignal = signal<AuthUser | null>(null);
  public readonly currentUser = this.currentUserSignal.asReadonly();

  private readonly snackBar = inject(MatSnackBar);

  // Chaves para localStorage
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  constructor(private router: Router) {
    super(inject(HttpClient));

    // Só inicializa autenticação no browser (não no SSR)
    if (this.isLocalStorageAvailable()) {
      this.initializeAuth();
    }
  }

  /**
   * Inicializa o estado de autenticação verificando tokens salvos
   */
  private initializeAuth(): void {
    // Verifica se localStorage está disponível (não está no SSR)
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    const token = this.getStoredToken();
    const user = this.getStoredUser();

    if (token && user) {
      this.setCurrentUser(user);
    }
  }

  /**
   * Realiza login do usuário
   */
  login(credentials: LoginRequest): Observable<AuthUser> {
    this.setLoading(true);

    return this.http.post<LoginResponse>(this.buildUrl('auth/login'), credentials, this.httpOptions)
      .pipe(
        tap((response: LoginResponse) => {
          this.storeAuthData(response);
          this.setCurrentUser(response.user);
          this.setLoading(false);
        }),
        map((response: LoginResponse) => response.user),
        catchError(error => {
          console.error('Erro no login:', error);
          this.setLoading(false);

          // Simulação de login para desenvolvimento
          if (credentials.email === 'admin@gestao.com' && credentials.password === 'admin123') {
            const mockUser: AuthUser = {
              id: '67781ba123456789abcdef01',
              name: 'Administrador',
              email: 'admin@gestao.com',
              avatar: 'https://i.pravatar.cc/150?u=admin',
              department: 'Tecnologia',
              role: 'admin'
            };

            const mockResponse: LoginResponse = {
              token: 'mock_token_' + Date.now(),
              refreshToken: 'mock_refresh_' + Date.now(),
              user: mockUser,
              expiresIn: 3600
            };

            this.storeAuthData(mockResponse);
            this.setCurrentUser(mockUser);
            return of(mockUser);
          }

          throw error;
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
          this.clearAuthData();
        }),
        catchError(error => {
          console.warn('Erro no logout da API, limpando dados localmente:', error);
          this.clearAuthData();
          return of(undefined);
        })
      );
  }

  /**
   * Solicita reset de senha
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<{ message: string }> {
    this.setLoading(true);

    return this.http.post<{ message: string }>(this.buildUrl('auth/forgot-password'), request, this.httpOptions)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('Erro ao solicitar reset de senha:', error);
          this.setLoading(false);

          // Simulação para desenvolvimento
          return of({ message: 'E-mail de recuperação enviado com sucesso!' });
        })
      );
  }

  /**
   * Redefine senha com token
   */
  resetPassword(request: ResetPasswordRequest): Observable<{ message: string }> {
    this.setLoading(true);

    return this.http.post<{ message: string }>(this.buildUrl('auth/reset-password'), request, this.httpOptions)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('Erro ao redefinir senha:', error);
          this.setLoading(false);
          throw error;
        })
      );
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }

  /**
   * Obtém informações do usuário atual
   */
  getCurrentUser(): Observable<AuthUser> {
    const token = this.getStoredToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    return this.http.get<AuthUser>(this.buildUrl('auth/me'), this.httpOptions)
      .pipe(
        tap((user: AuthUser) => {
          this.setCurrentUser(user);
          this.storeUser(user);
        }),
        catchError(error => {
          console.error('Erro ao obter usuário atual:', error);
          const storedUser = this.getStoredUser();
          if (storedUser) {
            return of(storedUser);
          }
          throw error;
        })
      );
  }

  /**
   * Atualiza token usando refresh token
   */
  refreshToken(): Observable<string> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      throw new Error('Refresh token não encontrado');
    }

    return this.http.post<{ token: string; expiresIn: number }>(
      this.buildUrl('auth/refresh'),
      { refreshToken },
      this.httpOptions
    ).pipe(
      tap((response) => {
        this.storeToken(response.token);
      }),
      map((response) => response.token),
      catchError(error => {
        console.error('Erro ao renovar token:', error);
        this.clearAuthData();
        this.router.navigate(['/login']);
        throw error;
      })
    );
  }

  /**
   * Armazena dados de autenticação
   */
  private storeAuthData(response: LoginResponse): void {
    this.storeToken(response.token);
    this.storeRefreshToken(response.refreshToken);
    this.storeUser(response.user);
  }

  /**
   * Armazena token no localStorage
   */
  private storeToken(token: string): void {
    this.safeSetItem(this.TOKEN_KEY, token);
  }

  /**
   * Armazena refresh token no localStorage
   */
  private storeRefreshToken(refreshToken: string): void {
    this.safeSetItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Armazena usuário no localStorage
   */
  private storeUser(user: AuthUser): void {
    this.safeSetItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Obtém token do localStorage
   */
  getStoredToken(): string | null {
    return this.safeGetItem(this.TOKEN_KEY);
  }

  /**
   * Obtém refresh token do localStorage
   */
  private getStoredRefreshToken(): string | null {
    return this.safeGetItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Obtém usuário do localStorage
   */
  private getStoredUser(): AuthUser | null {
    const userStr = this.safeGetItem(this.USER_KEY);
    if (!userStr) {
      return null;
    }

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.warn('Erro ao fazer parse do usuário armazenado:', error);
      // Remove dados corrompidos
      this.safeRemoveItem(this.USER_KEY);
      return null;
    }
  }

  /**
   * Define usuário atual
   */
  private setCurrentUser(user: AuthUser | null): void {
    this.currentUserSignal.set(user);
    this.currentUserSubject.next(user);
  }

  /**
   * Limpa todos os dados de autenticação
   */
  private clearAuthData(): void {
    this.safeRemoveItem(this.TOKEN_KEY);
    this.safeRemoveItem(this.REFRESH_TOKEN_KEY);
    this.safeRemoveItem(this.USER_KEY);
    this.setCurrentUser(null);
    this.router.navigate(['/login']);
  }

  /**
   * Verifica se o localStorage está disponível
   */
  private isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
      return false;
    }
  }

  /**
   * Método seguro para acessar localStorage
   */
  private safeGetItem(key: string): string | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  /**
   * Método seguro para definir item no localStorage
   */
  private safeSetItem(key: string, value: string): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Erro ao salvar no localStorage:', error);
    }
  }

  /**
   * Método seguro para remover item do localStorage
   */
  private safeRemoveItem(key: string): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Erro ao remover do localStorage:', error);
    }
  }

  /**
   * Controla estado de loading
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Exibe snackbar com estilos personalizados
   */
  public showSnackbar(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' | 'primary' = 'primary',
    duration: number = 4000,
    action?: string
  ): void {
    this.snackBar.open(message, action || 'Fechar', {
      duration,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }
}
