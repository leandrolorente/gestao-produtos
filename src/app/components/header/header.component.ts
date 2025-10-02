import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService, AuthUser } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);

  isSidebarOpen = input<boolean>(false);
  sidebarToggle = output<void>();

  // Signal local para o usuário
  currentUser = signal<AuthUser | null>(null);

  // Signals para o tema
  readonly isDarkMode = this.themeService.isDarkMode;
  readonly currentTheme = this.themeService.currentTheme;

  ngOnInit(): void {
    // Subscreve ao usuário atual do AuthService
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  protected toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.authService.showSnackbar('Logout realizado com sucesso!', 'success');
      },
      error: (error) => {
        console.error('Erro no logout:', error);
        this.authService.showSnackbar('Erro ao fazer logout', 'error');
      }
    });
  }

  onProfile() {
    this.authService.showSnackbar('Funcionalidade em desenvolvimento', 'info');
  }

  onSettings() {
    this.authService.showSnackbar('Funcionalidade em desenvolvimento', 'info');
  }

  /**
   * Alterna entre modo claro e escuro
   */
  onToggleTheme() {
    this.themeService.toggleTheme();
    const newMode = !this.isDarkMode() ? 'noturno' : 'claro';
    this.authService.showSnackbar(`Modo ${newMode} ativado`, 'success');
  }
}
