import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { Sidebar } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    Sidebar
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayout {

  protected isSidebarOpen = signal(false);

  protected toggleSidebar(): void {
    this.isSidebarOpen.update(value => !value);
  }

  protected closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
}
