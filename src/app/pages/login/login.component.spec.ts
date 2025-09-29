import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'login',
      'forgotPassword',
      'isAuthenticated'
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Mock dos retornos dos métodos
    mockAuthService.isAuthenticated.and.returnValue(false);
    mockAuthService.login.and.returnValue(of({
      id: 1,
      name: 'Test User',
      email: 'test@test.com',
      department: 'TI'
    }));
    mockAuthService.forgotPassword.and.returnValue(of({
      message: 'E-mail enviado'
    }));

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with demo credentials', () => {
    expect(component.loginForm.get('email')?.value).toBe('admin@gestao.com');
    expect(component.loginForm.get('password')?.value).toBe('admin123');
  });

  it('should redirect if user is already authenticated', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);
    component.ngOnInit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should validate required fields', () => {
    component.loginForm.patchValue({
      email: '',
      password: ''
    });

    expect(component.loginForm.invalid).toBeTruthy();
    expect(component.getFieldErrorMessage('email')).toContain('obrigatório');
    expect(component.getFieldErrorMessage('password')).toContain('obrigatório');
  });

  it('should validate email format', () => {
    component.loginForm.patchValue({
      email: 'invalid-email'
    });

    expect(component.getFieldErrorMessage('email')).toContain('e-mail válido');
  });

  it('should validate password minimum length', () => {
    component.loginForm.patchValue({
      password: '123'
    });

    expect(component.getFieldErrorMessage('password')).toContain('pelo menos');
  });

  it('should perform login successfully', () => {
    component.loginForm.patchValue({
      email: 'test@test.com',
      password: 'password123'
    });

    component.onLogin();

    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123'
    });
  });

  it('should handle login error', () => {
    const error = { status: 401 };
    mockAuthService.login.and.returnValue(throwError(() => error));

    component.loginForm.patchValue({
      email: 'test@test.com',
      password: 'wrongpassword'
    });

    component.onLogin();

    expect(mockSnackBar.open).toHaveBeenCalled();
  });

  it('should show forgot password form', () => {
    component.showForgotPasswordForm();
    expect(component.showForgotPassword).toBeTruthy();
    expect(component.showSuccessMessage).toBeFalsy();
  });

  it('should send forgot password request', () => {
    component.forgotPasswordForm.patchValue({
      email: 'test@test.com'
    });

    component.onForgotPassword();

    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith({
      email: 'test@test.com'
    });
  });

  it('should return to login form', () => {
    component.showForgotPassword = true;
    component.showSuccessMessage = true;

    component.showLoginForm();

    expect(component.showForgotPassword).toBeFalsy();
    expect(component.showSuccessMessage).toBeFalsy();
  });
});
