import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { DashboardService } from '../../services/dashboard';

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
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  private dashboardService = inject(DashboardService);

  isSidebarOpen = input<boolean>(false);
  sidebarToggle = output<void>();

  currentUser = this.dashboardService.getCurrentUser();

  protected toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  onLogout() {
    this.dashboardService.logout();
  }

  onProfile() {
    console.log('Abrir perfil do usuário');
  }

  onSettings() {
    console.log('Abrir configurações');
  }
}
