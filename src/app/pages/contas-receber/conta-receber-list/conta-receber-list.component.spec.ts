import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { ContaReceberListComponent } from './conta-receber-list.component';
import { ContaReceberService } from '../../../services/conta-receber.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { ContaReceber, StatusContaReceber } from '../../../models/ContaReceber';

describe('ContaReceberListComponent', () => {
  let component: ContaReceberListComponent;
  let fixture: ComponentFixture<ContaReceberListComponent>;
  let contaReceberService: jasmine.SpyObj<ContaReceberService>;
  let confirmationService: jasmine.SpyObj<ConfirmationDialogService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const mockContas: ContaReceber[] = [
    {
      id: '1',
      numero: 'REC-001',
      descricao: 'Venda Produto A',
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
      diasVencimento: 0,
      observacoes: 'Conta teste',
      ehRecorrente: false,
      dataCriacao: '2024-01-01T00:00:00Z',
      dataAtualizacao: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    const contaReceberServiceSpy = jasmine.createSpyObj('ContaReceberService', [
      'getAll', 'delete', 'cancelar'
    ]);
    const confirmationServiceSpy = jasmine.createSpyObj('ConfirmationDialogService', [
      'confirmDelete'
    ]);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        ContaReceberListComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ContaReceberService, useValue: contaReceberServiceSpy },
        { provide: ConfirmationDialogService, useValue: confirmationServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContaReceberListComponent);
    component = fixture.componentInstance;
    contaReceberService = TestBed.inject(ContaReceberService) as jasmine.SpyObj<ContaReceberService>;
    confirmationService = TestBed.inject(ConfirmationDialogService) as jasmine.SpyObj<ConfirmationDialogService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    contaReceberService.getAll.and.returnValue(of(mockContas));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load contas on init', () => {
    fixture.detectChanges();

    expect(contaReceberService.getAll).toHaveBeenCalled();
    expect(component.dataSource.data).toEqual(mockContas);
  });

  it('should calculate statistics correctly', () => {
    component.calcularEstatisticas(mockContas);

    expect(component.totalPendente()).toBe(1000);
    expect(component.quantidadePendente()).toBe(1);
  });

  it('should format currency correctly', () => {
    const formatted = component.formatCurrency(1000);
    expect(formatted).toContain('R$');
    expect(formatted).toContain('1.000,00');
  });

  it('should format date correctly', () => {
    const formatted = component.formatDate('2024-01-30');
    expect(formatted).toBe('30/01/2024');
  });

  it('should get status label correctly', () => {
    const label = component.getStatusLabel(StatusContaReceber.Pendente);
    expect(label).toBe('Pendente');
  });

  it('should get status color correctly', () => {
    const color = component.getStatusColor(StatusContaReceber.Pendente);
    expect(color).toBe('warn');
  });

  it('should detect expired account', () => {
    const contaVencida = { ...mockContas[0], estaVencida: true };
    expect(component.isVencida(contaVencida)).toBe(true);
  });

  it('should clear filters', () => {
    component.filterForm.patchValue({ busca: 'test', status: '1' });
    component.clearFilters();

    expect(component.filterForm.get('busca')?.value).toBe(null);
    expect(component.filterForm.get('status')?.value).toBe(null);
  });

  it('should cancel conta with confirmation', () => {
    confirmationService.confirmDelete.and.returnValue(of(true));
    contaReceberService.cancelar.and.returnValue(of(undefined));

    component.cancelarConta(mockContas[0]);

    expect(confirmationService.confirmDelete).toHaveBeenCalled();
    expect(contaReceberService.cancelar).toHaveBeenCalledWith('1');
  });

  it('should not cancel conta when not confirmed', () => {
    confirmationService.confirmDelete.and.returnValue(of(false));

    component.cancelarConta(mockContas[0]);

    expect(confirmationService.confirmDelete).toHaveBeenCalled();
    expect(contaReceberService.cancelar).not.toHaveBeenCalled();
  });

  it('should delete conta with confirmation', () => {
    confirmationService.confirmDelete.and.returnValue(of(true));
    contaReceberService.delete.and.returnValue(of(undefined));

    component.deleteConta(mockContas[0]);

    expect(confirmationService.confirmDelete).toHaveBeenCalled();
    expect(contaReceberService.delete).toHaveBeenCalledWith('1');
  });

  it('should handle error when loading contas', () => {
    contaReceberService.getAll.and.returnValue(throwError(() => new Error('Erro de teste')));

    component.loadContas();

    expect(component.isLoading()).toBe(false);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Erro ao carregar contas a receber',
      'Fechar',
      jasmine.any(Object)
    );
  });

  it('should export to CSV when data exists', () => {
    component.dataSource.data = mockContas;
    spyOn(document, 'createElement').and.callThrough();
    spyOn(URL, 'createObjectURL').and.returnValue('mock-url');

    component.exportToCsv();

    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  it('should show warning when trying to export empty data', () => {
    component.dataSource.data = [];

    component.exportToCsv();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Nenhum dado para exportar',
      'Fechar',
      jasmine.any(Object)
    );
  });

  it('should apply filters correctly', () => {
    component.dataSource.data = mockContas;
    component.filterForm.patchValue({ busca: 'REC-001' });

    component.applyFilters();

    expect(component.dataSource.filter).toContain('REC-001');
  });
});
