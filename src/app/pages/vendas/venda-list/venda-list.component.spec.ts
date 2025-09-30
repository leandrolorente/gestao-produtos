import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { VendaListComponent } from './venda-list.component';
import { VendaService } from '../../../services/venda.service';
import { Venda } from '../../../models/Venda';

describe('VendaListComponent', () => {
  let component: VendaListComponent;
  let fixture: ComponentFixture<VendaListComponent>;
  let mockVendaService: jasmine.SpyObj<VendaService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockVendas: Venda[] = [
    {
      id: '1',
      numero: 'VND-001',
      clienteId: '1',
      clienteNome: 'João Silva',
      clienteEmail: 'joao@email.com',
      items: [
        {
          id: '1',
          produtoId: '1',
          produtoNome: 'Produto Teste',
          produtoSku: 'PROD-001',
          quantidade: 2,
          precoUnitario: 100,
          subtotal: 200
        }
      ],
      subtotal: 200,
      desconto: 0,
      total: 200,
      formaPagamento: 'PIX',
      status: 'Finalizada',
      dataVenda: new Date(),
      ultimaAtualizacao: new Date()
    }
  ];

  beforeEach(async () => {
    // Criar spies dos serviços
    mockVendaService = jasmine.createSpyObj('VendaService', [
      'getAllVendas',
      'getVendasStats',
      'createVenda',
      'updateVenda',
      'deleteVenda'
    ]);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Configurar retornos dos métodos mockados
    mockVendaService.getAllVendas.and.returnValue(of(mockVendas));
    mockVendaService.getVendasStats.and.returnValue(of({
      totalVendas: 1,
      vendasHoje: 1,
      faturamentoMes: 200,
      ticketMedio: 200,
      vendasPendentes: 0,
      topClientes: [],
      vendasPorMes: []
    }));

    await TestBed.configureTestingModule({
      imports: [
        VendaListComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: VendaService, useValue: mockVendaService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VendaListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load vendas on init', () => {
    expect(mockVendaService.getAllVendas).toHaveBeenCalled();
    expect(component.vendas().length).toBe(1);
    expect(component.dataSource.data.length).toBe(1);
  });

  it('should load stats on init', () => {
    expect(mockVendaService.getVendasStats).toHaveBeenCalled();
    expect(component.stats()).toBeTruthy();
  });

  it('should calculate vendas hoje correctly', () => {
    const hoje = new Date().toDateString();
    const vendaHoje = { ...mockVendas[0], dataVenda: new Date() };
    component.vendas.set([vendaHoje]);

    expect(component.vendasHoje()).toBe(1);
  });

  it('should calculate faturamento mes correctly', () => {
    const vendaDoMes = {
      ...mockVendas[0],
      dataVenda: new Date(),
      status: 'Finalizada' as const,
      total: 300
    };
    component.vendas.set([vendaDoMes]);

    expect(component.faturamentoMes()).toBe(300);
  });

  it('should calculate vendas pendentes correctly', () => {
    const vendaPendente = { ...mockVendas[0], status: 'Pendente' as const };
    component.vendas.set([vendaPendente]);

    expect(component.vendasPendentes()).toBe(1);
  });

  it('should format price correctly', () => {
    const formatted = component.formatPrice(1234.56);
    expect(formatted).toBe('R$ 1.234,56');
  });

  it('should format date correctly', () => {
    const date = new Date('2024-12-15');
    const formatted = component.formatDate(date);
    expect(formatted).toBe('15/12/2024');
  });

  it('should get correct status chip color', () => {
    expect(component.getStatusChipColor('Finalizada')).toBe('primary');
    expect(component.getStatusChipColor('Confirmada')).toBe('accent');
    expect(component.getStatusChipColor('Pendente')).toBe('warn');
    expect(component.getStatusChipColor('Cancelada')).toBe('');
  });

  it('should open create dialog', () => {
    const dialogRefMock = { afterClosed: () => of(null) };
    mockDialog.open.and.returnValue(dialogRefMock as any);

    component.openCreateDialog();

    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should open edit dialog', () => {
    const dialogRefMock = { afterClosed: () => of(null) };
    mockDialog.open.and.returnValue(dialogRefMock as any);

    component.openEditDialog(mockVendas[0]);

    expect(mockDialog.open).toHaveBeenCalledWith(
      jasmine.any(Function),
      jasmine.objectContaining({
        data: { venda: mockVendas[0], editMode: true }
      })
    );
  });

  it('should apply search filter', () => {
    component.vendas.set(mockVendas);
    component.searchControl.setValue('João');

    // Simula o debounce
    component['applyFilters']();

    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].clienteNome).toBe('João Silva');
  });

  it('should apply status filter', () => {
    const vendasMistas = [
      { ...mockVendas[0], status: 'Finalizada' as const },
      { ...mockVendas[0], id: '2', status: 'Pendente' as const }
    ];
    component.vendas.set(vendasMistas);
    component.statusFilter.setValue('Pendente');

    component['applyFilters']();

    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].status).toBe('Pendente');
  });

  it('should clear filters', () => {
    component.searchControl.setValue('teste');
    component.statusFilter.setValue('Pendente');
    component.formaPagamentoFilter.setValue('PIX');

    component.clearFilters();

    expect(component.searchControl.value).toBe('');
    expect(component.statusFilter.value).toBe('');
    expect(component.formaPagamentoFilter.value).toBe('');
  });

  it('should delete venda with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockVendaService.deleteVenda.and.returnValue(of(void 0));

    component.deleteVenda(mockVendas[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockVendaService.deleteVenda).toHaveBeenCalledWith('1');
  });

  it('should not delete venda without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteVenda(mockVendas[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockVendaService.deleteVenda).not.toHaveBeenCalled();
  });
});
