import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { ContaReceberDialogComponent } from './conta-receber-dialog.component';
import { ContaReceberService } from '../../services/conta-receber.service';
import { ContaReceber, StatusContaReceber } from '../../models/ContaReceber';
import { FormaPagamento, TipoRecorrencia } from '../../models/ContaPagar';

describe('ContaReceberDialogComponent', () => {
  let component: ContaReceberDialogComponent;
  let fixture: ComponentFixture<ContaReceberDialogComponent>;
  let contaReceberService: jasmine.SpyObj<ContaReceberService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialogRef: jasmine.SpyObj<any>;

  const mockConta: ContaReceber = {
    id: '1',
    numero: 'REC-001',
    descricao: 'Teste conta',
    clienteId: '1',
    clienteNome: 'Cliente Teste',
    vendedorId: '1',
    vendedorNome: 'Vendedor Teste',
    valorOriginal: 1000,
    valorRecebido: 0,
    valorRestante: 1000,
    desconto: 0,
    juros: 0,
    multa: 0,
    dataEmissao: '2024-01-01',
    dataVencimento: '2024-01-30',
    dataRecebimento: undefined,
    status: StatusContaReceber.Pendente,
    estaVencida: false,
    observacoes: 'Teste',
    ehRecorrente: false,
    tipoRecorrencia: undefined,
    diasVencimento: 0,
    dataCriacao: '2024-01-01T00:00:00Z',
    dataAtualizacao: '2024-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    const contaReceberServiceSpy = jasmine.createSpyObj('ContaReceberService', [
      'create', 'update'
    ]);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        ContaReceberDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ContaReceberService, useValue: contaReceberServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContaReceberDialogComponent);
    component = fixture.componentInstance;
    contaReceberService = TestBed.inject(ContaReceberService) as jasmine.SpyObj<ContaReceberService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    // Mock data
    component.data = { isEdit: false };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    fixture.detectChanges();
    
    expect(component.form.get('numero')?.value).toBe('');
    expect(component.form.get('descricao')?.value).toBe('');
    expect(component.form.get('valorOriginal')?.value).toBe(0);
    expect(component.form.get('ehRecorrente')?.value).toBe(false);
  });

  it('should generate number automatically', () => {
    component.generateNumber();
    
    const numero = component.form.get('numero')?.value;
    expect(numero).toContain('REC-');
    expect(numero?.length).toBeGreaterThan(4);
  });

  it('should show correct dialog title for create', () => {
    component.data = { isEdit: false };
    expect(component.getDialogTitle()).toBe('Nova Conta a Receber');
  });

  it('should show correct dialog title for edit', () => {
    component.data = { isEdit: true };
    expect(component.getDialogTitle()).toBe('Editar Conta a Receber');
  });

  it('should validate required fields', () => {
    component.form.patchValue({
      numero: '',
      descricao: '',
      valorOriginal: 0
    });
    
    component.form.markAllAsTouched();
    
    expect(component.form.invalid).toBe(true);
    expect(component.hasFieldError('numero')).toBe(true);
    expect(component.hasFieldError('descricao')).toBe(true);
    expect(component.hasFieldError('valorOriginal')).toBe(true);
  });

  it('should return correct field error messages', () => {
    component.form.get('numero')?.setErrors({ required: true });
    component.form.get('numero')?.markAsTouched();
    
    const errorMessage = component.getFieldErrorMessage('numero');
    expect(errorMessage).toBe('Número é obrigatório');
  });
});