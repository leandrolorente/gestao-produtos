import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';

  // Signal para controlar o tema atual
  private readonly _currentTheme = signal<Theme>(this.getStoredTheme());

  // Getter público para o tema atual
  readonly currentTheme = this._currentTheme.asReadonly();

  // Signal computed para verificar se está no modo escuro
  readonly isDarkMode = signal(this._currentTheme() === 'dark');

  constructor() {
    // Effect para aplicar o tema sempre que mudar
    effect(() => {
      this.applyTheme(this._currentTheme());
      this.isDarkMode.set(this._currentTheme() === 'dark');
    });

    // Aplicar tema inicial
    this.applyTheme(this._currentTheme());

    // Configurar listener para mudanças na preferência do sistema
    this.setupSystemThemeListener();

    // Verificar periodicamente se o localStorage foi limpo
    this.setupStorageWatcher();
  }

  /**
   * Configura listener para mudanças na preferência do sistema
   */
  private setupSystemThemeListener(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
          // Só aplica a mudança do sistema se não houver tema salvo
          try {
            if (!localStorage.getItem(this.THEME_KEY)) {
              const systemTheme: Theme = e.matches ? 'dark' : 'light';
              this._currentTheme.set(systemTheme);
            }
          } catch {
            // Se localStorage não funcionar, aplica a preferência do sistema
            const systemTheme: Theme = e.matches ? 'dark' : 'light';
            this._currentTheme.set(systemTheme);
          }
        });
      } catch (error) {
        console.warn('Erro ao configurar listener de tema do sistema:', error);
      }
    }
  }

  /**
   * Configura watcher para verificar se o localStorage foi limpo
   */
  private setupStorageWatcher(): void {
    if (typeof window !== 'undefined') {
      // Verifica a cada 30 segundos se o tema ainda está salvo
      setInterval(() => {
        try {
          const stored = localStorage.getItem(this.THEME_KEY);
          if (!stored && this._currentTheme() !== 'light') {
            // Se o localStorage foi limpo, restaura o tema atual
            this.storeTheme(this._currentTheme());
          }
        } catch {
          // Ignora erros silenciosamente se localStorage não funcionar
        }
      }, 30000);
    }
  }

  /**
   * Alterna entre tema claro e escuro
   */
  toggleTheme(): void {
    const newTheme: Theme = this._currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Define um tema específico
   */
  setTheme(theme: Theme): void {
    this._currentTheme.set(theme);
    this.storeTheme(theme);
  }

  /**
   * Recupera o tema atual caso tenha sido perdido
   */
  recoverTheme(): void {
    const currentTheme = this._currentTheme();
    try {
      const stored = localStorage.getItem(this.THEME_KEY);
      if (!stored) {
        // Se não há tema armazenado, salva o atual
        this.storeTheme(currentTheme);
      } else if (stored !== currentTheme) {
        // Se há divergência, prioriza o tema atual da aplicação
        this.storeTheme(currentTheme);
      }
    } catch {
      // Se localStorage não funcionar, mantém o tema atual
      console.warn('localStorage não disponível, mantendo tema na memória');
    }
  }

  /**
   * Força a reaplicação do tema atual
   */
  reapplyTheme(): void {
    this.applyTheme(this._currentTheme());
  }

  /**
   * Obtém o tema armazenado ou detecta preferência do sistema
   */
  private getStoredTheme(): Theme {
    try {
      // Verifica se localStorage está disponível
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.THEME_KEY) as Theme;
        if (stored && (stored === 'light' || stored === 'dark')) {
          return stored;
        }
      }
    } catch (error) {
      console.warn('Erro ao acessar localStorage para tema:', error);
    }

    // Detecta preferência do sistema como fallback
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } catch (error) {
        console.warn('Erro ao detectar preferência do sistema:', error);
      }
    }

    // Fallback final para tema claro
    return 'light';
  }

  /**
   * Armazena o tema no localStorage de forma segura
   */
  private storeTheme(theme: Theme): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.THEME_KEY, theme);
      }
    } catch (error) {
      console.warn('Erro ao salvar tema no localStorage:', error);
      // Em caso de erro, pelo menos mantém o tema na sessão atual
    }
  }

  /**
   * Aplica o tema ao documento
   */
  private applyTheme(theme: Theme): void {
    if (typeof document !== 'undefined') {
      const body = document.body;

      // Remove classes de tema existentes
      body.classList.remove('light-theme', 'dark-theme');

      // Adiciona a classe do tema atual
      body.classList.add(`${theme}-theme`);

      // Define atributo data-theme para compatibilidade com CSS
      body.setAttribute('data-theme', theme);

      // Define meta-theme-color para mobile
      this.updateMetaThemeColor(theme);
    }
  }

  /**
   * Atualiza a cor do tema no meta tag para mobile
   */
  private updateMetaThemeColor(theme: Theme): void {
    if (typeof document !== 'undefined') {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');

      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }

      // Cores para cada tema
      const themeColors = {
        light: '#667eea',
        dark: '#1a1a1a'
      };

      metaThemeColor.setAttribute('content', themeColors[theme]);
    }
  }

  /**
   * Obtém a cor primária do tema atual
   */
  getPrimaryColor(): string {
    return this._currentTheme() === 'dark' ? '#bb86fc' : '#667eea';
  }

  /**
   * Obtém a cor de fundo do tema atual
   */
  getBackgroundColor(): string {
    return this._currentTheme() === 'dark' ? '#121212' : '#ffffff';
  }

  /**
   * Obtém a cor do texto do tema atual
   */
  getTextColor(): string {
    return this._currentTheme() === 'dark' ? '#ffffff' : '#000000';
  }
}
