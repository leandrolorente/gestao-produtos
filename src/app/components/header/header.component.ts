import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { DashboardService } from '../../services/dashboard';
import { User } from '../../models/User';

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
  private dashboardService = inject(DashboardService);

  isSidebarOpen = input<boolean>(false);
  sidebarToggle = output<void>();

  // Signal local para o usuário
  currentUser = signal<User | null>(null);

  ngOnInit(): void {
    // Carrega dados do usuário ao inicializar
    this.dashboardService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser.set(user);
      },
      error: (error) => {
        console.error('Erro ao carregar usuário no header:', error);
        // Define um usuário padrão em caso de erro
        this.currentUser.set({
          id: 0,
          name: 'Usuário',
          email: 'usuario@exemplo.com',
          role: 'user',
          department: 'N/A',
          isActive: true,
          lastLogin: new Date(),
          avatar: ''
        });
      }
    });
  }

  protected toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  onLogout() {
    this.dashboardService.logout().subscribe({
      next: () => {
        console.log('Logout realizado com sucesso');
        // Aqui você pode redirecionar para a página de login
      },
      error: (error) => {
        console.error('Erro no logout:', error);
      }
    });
  }

  onProfile() {
    console.log('Abrir perfil do usuário');
  }

  onSettings() {
    console.log('Abrir configurações');
  }
}
