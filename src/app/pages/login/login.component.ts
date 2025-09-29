import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, LoginRequest, ForgotPasswordRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  forgotPasswordForm: FormGroup;
  hidePassword = true;
  showForgotPassword = false;
  showSuccessMessage = false;

  // Signal para controlar loading
  isLoading = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.createLoginForm();
    this.forgotPasswordForm = this.createForgotPasswordForm();
  }

  ngOnInit(): void {
    // Verifica se o usuário já está autenticado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    // Preenche dados de demonstração
    this.fillDemoCredentials();
  }

  /**
   * Cria o formulário de login
   */
  private createLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  /**
   * Cria o formulário de esqueceu a senha
   */
  private createForgotPasswordForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Preenche credenciais de demonstração
   */
  private fillDemoCredentials(): void {
    this.loginForm.patchValue({
      email: 'admin@gestao.com',
      password: 'admin123'
    });
  }

  /**
   * Realiza o login
   */
  onLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);

      const credentials: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(credentials).subscribe({
        next: (user) => {
          this.isLoading.set(false);
          this.showSuccessSnackBar(`Bem-vindo, ${user.name}!`);

          // Redireciona para dashboard após um breve delay
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1000);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.handleLoginError(error);
        }
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  /**
   * Processa esqueceu a senha
   */
  onForgotPassword(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading.set(true);

      const request: ForgotPasswordRequest = {
        email: this.forgotPasswordForm.value.email
      };

      this.authService.forgotPassword(request).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.showSuccessMessage = true;
          this.showForgotPassword = false;
          this.showSuccessSnackBar(response.message);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.handleForgotPasswordError(error);
        }
      });
    } else {
      this.markFormGroupTouched(this.forgotPasswordForm);
    }
  }

  /**
   * Mostra formulário de esqueceu a senha
   */
  showForgotPasswordForm(): void {
    this.showForgotPassword = true;
    this.showSuccessMessage = false;

    // Copia o email do formulário de login se existir
    const loginEmail = this.loginForm.get('email')?.value;
    if (loginEmail) {
      this.forgotPasswordForm.patchValue({ email: loginEmail });
    }
  }

  /**
   * Volta para formulário de login
   */
  showLoginForm(): void {
    this.showForgotPassword = false;
    this.showSuccessMessage = false;
  }

  /**
   * Trata erros de login
   */
  private handleLoginError(error: any): void {
    let message = 'Erro no login. Tente novamente.';

    if (error.status === 401) {
      message = 'E-mail ou senha incorretos.';
    } else if (error.status === 403) {
      message = 'Acesso negado. Conta pode estar bloqueada.';
    } else if (error.status === 429) {
      message = 'Muitas tentativas. Tente novamente em alguns minutos.';
    } else if (error.status === 0) {
      message = 'Erro de conexão. Verifique sua internet.';
    }

    this.showErrorSnackBar(message);
  }

  /**
   * Trata erros de esqueceu a senha
   */
  private handleForgotPasswordError(error: any): void {
    let message = 'Erro ao enviar e-mail. Tente novamente.';

    if (error.status === 404) {
      message = 'E-mail não encontrado em nosso sistema.';
    } else if (error.status === 429) {
      message = 'Muitas solicitações. Tente novamente em alguns minutos.';
    } else if (error.status === 0) {
      message = 'Erro de conexão. Verifique sua internet.';
    }

    this.showErrorSnackBar(message);
  }

  /**
   * Marca todos os campos do formulário como tocados
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtém mensagem de erro para campo do formulário de login
   */
  getFieldErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);

    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} é obrigatório`;
    }

    if (control?.hasError('email')) {
      return 'Por favor, insira um e-mail válido';
    }

    if (control?.hasError('minlength')) {
      const requiredLength = control.errors?.['minlength']?.requiredLength;
      return `Senha deve ter pelo menos ${requiredLength} caracteres`;
    }

    return '';
  }

  /**
   * Obtém mensagem de erro para campo do formulário de esqueceu a senha
   */
  getForgotFieldErrorMessage(fieldName: string): string {
    const control = this.forgotPasswordForm.get(fieldName);

    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} é obrigatório`;
    }

    if (control?.hasError('email')) {
      return 'Por favor, insira um e-mail válido';
    }

    return '';
  }

  /**
   * Obtém label do campo
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'E-mail',
      password: 'Senha'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Mostra snackbar de sucesso
   */
  private showSuccessSnackBar(message: string): void {
    this.authService.showSnackbar(message, 'success', 5000);
  }

  /**
   * Mostra snackbar de erro
   */
  private showErrorSnackBar(message: string): void {
    this.authService.showSnackbar(message, 'error', 8000);
  }
}
