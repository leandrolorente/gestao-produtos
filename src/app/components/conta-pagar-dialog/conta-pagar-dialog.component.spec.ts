import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ContaPagarDialogComponent, ContaPagarDialogData } from './conta-pagar-dialog.component';
import { ContaPagarService } from '../../services/conta-pagar.service';
import { ContaPagar, StatusContaPagar, FormaPagamento, CategoriaConta } from '../../models/ContaPagar';

describe('ContaPagarDialogComponent', () => {
  let component: ContaPagarDialogComponent;
  let fixture: ComponentFixture<ContaPagarDialogComponent>;
  let contaPagarService: jasmine.SpyObj<ContaPagarService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ContaPagarDialogComponent>>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockConta: ContaPagar = {
    id: '1',
    numero: 'PAG-001',
    descricao: 'Teste conta',
    fornecedorId: '1',
    fornecedorNome: 'Fornecedor Teste',
    valorOriginal: 1000,
    valorPago: 0,
    valorRestante: 1000,
    desconto: 0,
    juros: 0,
    multa: 0,
    dataEmissao: '2024-01-01',
    dataVencimento: '2024-01-30',
    dataPagamento: undefined,
    formaPagamento: FormaPagamento.PIX,
    categoria: CategoriaConta.Outros,
    status: StatusContaPagar.Pendente,
    estaVencida: false,
    observacoes: 'Teste',
    ehRecorrente: false,
    tipoRecorrencia: undefined,
    diasVencimento: 0,
    dataCriacao: '2024-01-01T00:00:00Z',
    dataAtualizacao: '2024-01-01T00:00:00Z'
  };

  const mockDialogData: ContaPagarDialogData = {
    conta: mockConta,
    isEdit: true
  };

  beforeEach(async () => {
    const contaPagarServiceSpy = jasmine.createSpyObj('ContaPagarService', [
      'create', 'update'
    ]);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        ContaPagarDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ContaPagarService, useValue: contaPagarServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContaPagarDialogComponent);
    component = fixture.componentInstance;
    contaPagarService = TestBed.inject(ContaPagarService) as jasmine.SpyObj<ContaPagarService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ContaPagarDialogComponent>>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load conta data on init when editing', () => {
    fixture.detectChanges();

    expect(component.form.get('numero')?.value).toBe(mockConta.numero);
    expect(component.form.get('descricao')?.value).toBe(mockConta.descricao);
    expect(component.form.get('valorOriginal')?.value).toBe(mockConta.valorOriginal);
  });

  it('should not load conta data when creating new', () => {
    component.data = { isEdit: false };
    fixture.detectChanges();

    expect(component.form.get('numero')?.value).toBe('');
    expect(component.form.get('descricao')?.value).toBe('');
  });

  it('should generate automatic number', () => {
    component.generateNumber();

    const numero = component.form.get('numero')?.value;
    expect(numero).toMatch(/PAG-\d{6}/);
  });

  it('should get correct dialog title for edit', () => {
    expect(component.getDialogTitle()).toBe('Editar Conta a Pagar');
  });

  it('should get correct dialog title for create', () => {
    component.data = { isEdit: false };
    expect(component.getDialogTitle()).toBe('Nova Conta a Pagar');
  });

  it('should get correct save button text', () => {
    expect(component.getSaveButtonText()).toBe('Atualizar');

    component.data = { isEdit: false };
    expect(component.getSaveButtonText()).toBe('Criar');
  });

  it('should get correct save button text when saving', () => {
    component.isSaving.set(true);
    expect(component.getSaveButtonText()).toBe('Atualizando...');

    component.data = { isEdit: false };
    expect(component.getSaveButtonText()).toBe('Criando...');
  });

  it('should validate required fields', () => {
    component.form.patchValue({
      numero: '',
      descricao: '',
      valorOriginal: 0
    });

    expect(component.form.invalid).toBe(true);
    expect(component.hasFieldError('numero')).toBe(false); // not touched yet

    component.form.get('numero')?.markAsTouched();
    expect(component.hasFieldError('numero')).toBe(true);
  });

  it('should get field error messages', () => {
    const control = component.form.get('numero');
    control?.setErrors({ required: true });
    control?.markAsTouched();

    expect(component.getFieldErrorMessage('numero')).toBe('Número é obrigatório');
  });

  it('should handle recorrente change', () => {
    component.form.patchValue({ recorrente: true });
    component.onRecorrenteChange();

    const tipoRecorrencia = component.form.get('tipoRecorrencia');
    const quantidadeParcelas = component.form.get('quantidadeParcelas');

    expect(tipoRecorrencia?.hasError('required')).toBe(true);
    expect(quantidadeParcelas?.hasError('required')).toBe(true);
  });

  it('should clear recorrencia validators when not recorrente', () => {
    component.form.patchValue({ recorrente: false });
    component.onRecorrenteChange();

    const tipoRecorrencia = component.form.get('tipoRecorrencia');
    const quantidadeParcelas = component.form.get('quantidadeParcelas');

    expect(tipoRecorrencia?.value).toBe(null);
    expect(quantidadeParcelas?.value).toBe(1);
  });

  it('should create conta successfully', () => {
    component.data = { isEdit: false };
    contaPagarService.create.and.returnValue(of(mockConta));

    component.form.patchValue({
      numero: 'PAG-001',
      descricao: 'Teste',
      valorOriginal: 1000,
      dataEmissao: new Date('2024-01-01'),
      dataVencimento: new Date('2024-01-30'),
      formaPagamento: FormaPagamento.PIX,
      categoria: CategoriaConta.Outros
    });

    component.onSubmit();

    expect(contaPagarService.create).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(mockConta);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Conta criada com sucesso!',
      'Fechar',
      jasmine.any(Object)
    );
  });

  it('should update conta successfully', () => {
    contaPagarService.update.and.returnValue(of(mockConta));

    component.form.patchValue({
      numero: 'PAG-001',
      descricao: 'Teste atualizado',
      valorOriginal: 1500,
      dataEmissao: new Date('2024-01-01'),
      dataVencimento: new Date('2024-01-30'),
      formaPagamento: FormaPagamento.PIX,
      categoria: CategoriaConta.Outros
    });

    component.onSubmit();

    expect(contaPagarService.update).toHaveBeenCalledWith(mockConta.id, jasmine.any(Object));
    expect(dialogRef.close).toHaveBeenCalledWith(mockConta);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Conta atualizada com sucesso!',
      'Fechar',
      jasmine.any(Object)
    );
  });

  it('should handle create error', () => {
    component.data = { isEdit: false };
    contaPagarService.create.and.returnValue(throwError(() => new Error('Erro de teste')));

    component.form.patchValue({
      numero: 'PAG-001',
      descricao: 'Teste',
      valorOriginal: 1000,
      dataEmissao: new Date('2024-01-01'),
      dataVencimento: new Date('2024-01-30'),
      formaPagamento: FormaPagamento.PIX,
      categoria: CategoriaConta.Outros
    });

    component.onSubmit();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Erro ao criar conta',
      'Fechar',
      jasmine.any(Object)
    );
    expect(component.isSaving()).toBe(false);
  });

  it('should handle update error', () => {
    contaPagarService.update.and.returnValue(throwError(() => new Error('Erro de teste')));

    component.form.patchValue({
      numero: 'PAG-001',
      descricao: 'Teste',
      valorOriginal: 1000,
      dataEmissao: new Date('2024-01-01'),
      dataVencimento: new Date('2024-01-30'),
      formaPagamento: FormaPagamento.PIX,
      categoria: CategoriaConta.Outros
    });

    component.onSubmit();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Erro ao atualizar conta',
      'Fechar',
      jasmine.any(Object)
    );
    expect(component.isSaving()).toBe(false);
  });

  it('should not submit invalid form', () => {
    component.form.patchValue({
      numero: '', // required field empty
      descricao: 'Teste'
    });

    component.onSubmit();

    expect(contaPagarService.create).not.toHaveBeenCalled();
    expect(contaPagarService.update).not.toHaveBeenCalled();
  });

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
