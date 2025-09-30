import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { VendaDialogComponent } from './venda-dialog.component';
import { ProdutoService } from '../../services/produto.service';
import { ClienteService } from '../../services/cliente.service';

describe('VendaDialogComponent', () => {
  let component: VendaDialogComponent;
  let fixture: ComponentFixture<VendaDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<VendaDialogComponent>>;
  let mockProdutoService: jasmine.SpyObj<ProdutoService>;
  let mockClienteService: jasmine.SpyObj<ClienteService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    // Criar spies dos serviços
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockProdutoService = jasmine.createSpyObj('ProdutoService', ['getAllProducts']);
    mockClienteService = jasmine.createSpyObj('ClienteService', ['getAllClientes']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Configurar retornos dos métodos mockados
    mockProdutoService.getAllProducts.and.returnValue(of([]));
    mockClienteService.getAllClientes.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        VendaDialogComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { editMode: false } },
        { provide: ProdutoService, useValue: mockProdutoService },
        { provide: ClienteService, useValue: mockClienteService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VendaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form in create mode', () => {
    expect(component.editMode).toBeFalse();
    expect(component.vendaForm).toBeDefined();
    expect(component.itemsArray.length).toBe(1); // Deve começar com um item
  });

  it('should load clientes and produtos on init', () => {
    expect(mockClienteService.getAllClientes).toHaveBeenCalled();
    expect(mockProdutoService.getAllProducts).toHaveBeenCalled();
  });

  it('should add new item to form array', () => {
    const initialLength = component.itemsArray.length;
    component.addItem();
    expect(component.itemsArray.length).toBe(initialLength + 1);
  });

  it('should remove item from form array', () => {
    // Adiciona um item primeiro para poder remover
    component.addItem();
    const initialLength = component.itemsArray.length;

    component.removeItem(1);
    expect(component.itemsArray.length).toBe(initialLength - 1);
  });

  it('should not remove the last item', () => {
    // Com apenas um item, não deve permitir remoção
    expect(component.itemsArray.length).toBe(1);
    component.removeItem(0);
    expect(component.itemsArray.length).toBe(1);
  });

  it('should calculate subtotal correctly', () => {
    // Simula dados no formulário
    component.vendaForm.patchValue({
      items: [
        { quantidade: 2, precoUnitario: 100 },
        { quantidade: 1, precoUnitario: 50 }
      ]
    });

    expect(component.subtotal()).toBe(250);
  });

  it('should calculate total with discount correctly', () => {
    component.vendaForm.patchValue({
      items: [{ quantidade: 2, precoUnitario: 100 }],
      desconto: 20
    });

    expect(component.total()).toBe(180);
  });

  it('should format price correctly', () => {
    const formatted = component.formatPrice(1234.56);
    expect(formatted).toBe('R$ 1.234,56');
  });

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should validate required fields', () => {
    component.vendaForm.patchValue({
      clienteId: '',
      formaPagamento: ''
    });

    expect(component.vendaForm.invalid).toBeTruthy();
    expect(component.getFieldErrorMessage('clienteId', 'Cliente')).toBe('Cliente é obrigatório');
  });

  it('should update item subtotal when quantity changes', () => {
    // Configura um item
    const itemGroup = component.itemsArray.at(0);
    itemGroup.patchValue({
      quantidade: 3,
      precoUnitario: 50
    });

    // Chama o método através do evento público
    component.onQuantidadeChange(0);

    expect(itemGroup.get('subtotal')?.value).toBe(150);
  });

  it('should select cliente correctly', () => {
    const mockCliente = {
      id: 1,
      nome: 'João Silva',
      email: 'joao@email.com',
      telefone: '11999999999',
      cpfCnpj: '123.456.789-00',
      endereco: 'Rua A, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567',
      tipo: 'Pessoa Física' as const,
      ativo: true,
      dataCadastro: new Date(),
      ultimaCompra: new Date(),
      observacoes: ''
    };

    component.onClienteSelected(mockCliente);

    expect(component.vendaForm.get('clienteId')?.value).toBe(1);
    expect(component.vendaForm.get('clienteNome')?.value).toBe('João Silva');
    expect(component.vendaForm.get('clienteEmail')?.value).toBe('joao@email.com');
  });

  it('should select produto correctly', () => {
    const mockProduto = {
      id: 1,
      name: 'Produto Teste',
      sku: 'PROD-001',
      quantity: 10,
      price: 99.99,
      lastUpdated: new Date()
    };

    component.onProdutoSelected(mockProduto, 0);

    const itemGroup = component.itemsArray.at(0);
    expect(itemGroup.get('produtoId')?.value).toBe(1);
    expect(itemGroup.get('produtoNome')?.value).toBe('Produto Teste');
    expect(itemGroup.get('produtoSku')?.value).toBe('PROD-001');
    expect(itemGroup.get('precoUnitario')?.value).toBe(99.99);
  });
});
