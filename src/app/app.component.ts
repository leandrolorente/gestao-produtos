import { Component, signal, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ReactiveFormsModule,

    MatToolbarModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App implements OnInit {
  private themeService = inject(ThemeService);

  protected readonly title = signal('gestao-produtos');

  ngOnInit(): void {
    // Inicializa o serviço de tema
    // O tema será aplicado automaticamente através do effect no service

    // Recupera o tema se necessário (caso localStorage tenha sido limpo)
    this.themeService.recoverTheme();

    // Listener para quando a aba volta a ter foco (caso localStorage tenha sido limpo)
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.themeService.reapplyTheme();
      });
    }
  }
}
