import { Component, inject, OnInit, OnDestroy, signal, computed, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { Observable, startWith, map } from 'rxjs';

// Models
import { Venda, VendaCreate, VendaItem } from '../../models/Venda';
import { Product } from '../../models/Product';
import { Cliente } from '../../models/Cliente';

// Services
import { ProdutoService } from '../../services/produto.service';
import { ClienteService } from '../../services/cliente.service';
import { AuthService } from '../../services/auth.service';

export interface VendaDialogData {
  venda?: Venda;
  editMode: boolean;
  readOnlyClient?: boolean;
}

@Component({
  selector: 'app-venda-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatIconModule,
    MatCardModule,
    MatTableModule
  ],
  templateUrl: './venda-dialog.component.html',
  styleUrls: ['./venda-dialog.component.scss']
})
export class VendaDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<VendaDialogComponent>);
  private readonly data = inject<VendaDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly produtoService = inject(ProdutoService);
  private readonly clienteService = inject(ClienteService);
  private readonly authService = inject(AuthService);
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  vendaForm!: FormGroup;
  editMode = false;

  // Signals para dados
  clientes = signal<Cliente[]>([]);
  produtos = signal<Product[]>([]);
  clientesFiltrados = signal<Cliente[]>([]);
  produtosFiltrados = signal<Product[]>([]);

  // Signals para totais (atualizados manualmente)
  subtotalValue = signal<number>(0);
  totalValue = signal<number>(0);

  // Controle de estado dos autocompletetes
  clienteAutoCompleteOpen = signal<boolean>(false);
  produtoAutoCompleteOpen = signal<boolean>(false);

  // Computed para verificar se o cliente está em modo somente leitura
  clienteReadOnly = computed(() => this.data?.readOnlyClient === true);

  // Getters para compatibilidade
  get subtotal() {
    return this.subtotalValue();
  }

  get total() {
    return this.totalValue();
  }

  // Opções de pagamento e status
  formasPagamento = [
    'Dinheiro',
    'PIX',
    'Cartão de Débito',
    'Cartão de Crédito',
    'Boleto',
    'Transferência'
  ];

  statusOptions = [
    'Pendente',
    'Confirmada',
    'Finalizada',
    'Cancelada'
  ];

  // Colunas da tabela de itens
  displayedColumns = ['produto', 'quantidade', 'precoUnitario', 'subtotal', 'acoes'];

  ngOnInit(): void {
    this.editMode = this.data?.editMode || false;
    this.initializeForm();
    this.loadClientes();
    this.loadProdutos();
    this.setupAutocompleteFiltros();
  }

  private initializeForm(): void {
    this.vendaForm = this.fb.group({
      id: [''],
      numero: [''],
      clienteId: ['', Validators.required],
      clienteNome: [''],
      clienteEmail: [''],
      items: this.fb.array([]),
      desconto: [0, [Validators.min(0)]],
      formaPagamento: ['', Validators.required],
      status: ['Pendente'],
      observacoes: [''],
      dataVenda: [new Date()],
      dataVencimento: [''],
      vendedorId: [''],
      vendedorNome: ['']
    });

    // Se em modo de edição, preenche o formulário
    if (this.editMode && this.data?.venda) {
      this.populateForm(this.data.venda);
      
      // Desabilita campos do cliente se readOnlyClient for true
      if (this.data.readOnlyClient) {
        this.vendaForm.get('clienteId')?.disable();
        this.vendaForm.get('clienteNome')?.disable();
        this.vendaForm.get('clienteEmail')?.disable();
      }
    } else {
      // Adiciona um item vazio para começar
      this.addItem();
    }

    // Listener para mudanças no desconto
    this.vendaForm.get('desconto')?.valueChanges.subscribe(() => {
      this.updateTotals();
    });

    // Inicializar totais
    setTimeout(() => this.updateTotals(), 100);
  }

  private populateForm(venda: Venda): void {
    this.vendaForm.patchValue({
      id: venda.id,
      numero: venda.numero,
      clienteId: venda.clienteId,
      clienteNome: venda.clienteNome,
      clienteEmail: venda.clienteEmail,
      desconto: venda.desconto,
      formaPagamento: venda.formaPagamento,
      status: venda.status,
      observacoes: venda.observacoes,
      dataVenda: venda.dataVenda,
      dataVencimento: venda.dataVencimento,
      vendedorId: venda.vendedorId,
      vendedorNome: venda.vendedorNome
    });

    // Adiciona os itens
    const itemsArray = this.vendaForm.get('items') as FormArray;
    venda.items.forEach(item => {
      itemsArray.push(this.createItemFormGroup(item));
    });

    // Atualizar totais após carregar todos os dados
    setTimeout(() => this.updateTotals(), 100);
  }

  private loadClientes(): void {
    this.clienteService.getAllClientes().subscribe({
      next: (clientes: any) => {
        this.clientes.set(clientes);
        // Não definir clientesFiltrados aqui - será definido quando o usuário focar no campo
      },
      error: (error: any) => {
        console.error('Erro ao carregar clientes:', error);
        this.authService.showSnackbar('Erro ao carregar clientes', 'error');
      }
    });
  }

  private loadProdutos(): void {
    this.produtoService.getAllProducts().subscribe({
      next: (produtos: any) => {
        this.produtos.set(produtos);
        // Em modo de edição, não preencher automaticamente para evitar autocomplete aberto
        if (!this.editMode) {
          this.produtosFiltrados.set(produtos);
        }
      },
      error: (error: any) => {
        console.error('Erro ao carregar produtos:', error);
        this.authService.showSnackbar('Erro ao carregar produtos', 'error');
      }
    });
  }

  private setupAutocompleteFiltros(): void {
    // Não configuramos valueChanges para clientes aqui pois controlamos manualmente
    // via onClienteFocus e onClienteInput

    // Configurar filtros para produtos quando itens são adicionados
    this.itemsArray.valueChanges.pipe(
      startWith([])
    ).subscribe(() => {
      this.updateProdutosFiltros();
    });
  }

  private updateProdutosFiltros(): void {
    // Para simplicidade, usar apenas um filtro global de produtos por enquanto
    // Pode ser melhorado para filtros individuais por item no futuro
    // Em modo de edição, não preencher automaticamente para evitar autocomplete aberto
    if (!this.editMode) {
      this.produtosFiltrados.set(this.produtos());
    }
  }

  private filtrarClientes(value: string): Cliente[] {
    if (!value || value.trim() === '') {
      // Quando clica no campo mas não digitou nada, mostra todos
      return this.clientes();
    }
    const filterValue = value.toLowerCase();
    return this.clientes().filter(cliente =>
      cliente.nome.toLowerCase().includes(filterValue) ||
      cliente.email.toLowerCase().includes(filterValue)
    );
  }

  private filtrarProdutos(value: string): Product[] {
    if (!value) return this.produtos();
    const filterValue = value.toLowerCase();
    return this.produtos().filter(produto =>
      produto.name.toLowerCase().includes(filterValue) ||
      produto.sku.toLowerCase().includes(filterValue)
    );
  }

  get itemsArray(): FormArray {
    return this.vendaForm.get('items') as FormArray;
  }

  private createItemFormGroup(item?: VendaItem): FormGroup {
    return this.fb.group({
      id: [item?.id || ''],
      produtoId: [item?.produtoId || '', Validators.required],
      produtoNome: [item?.produtoNome || ''],
      produtoSku: [item?.produtoSku || ''],
      quantidade: [item?.quantidade || 1, [Validators.required, Validators.min(1)]],
      precoUnitario: [item?.precoUnitario || 0, [Validators.required, Validators.min(0)]],
      subtotal: [{ value: item?.subtotal || 0, disabled: true }]
    });
  }

  addItem(): void {
    const newItem = this.createItemFormGroup();
    this.itemsArray.push(newItem);

    // Atualizar totais
    this.updateTotals();
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);

      // Atualizar totais
      this.updateTotals();
    }
  }

  onQuantidadeChange(itemIndex: number): void {
    this.updateItemSubtotal(itemIndex);
  }

  onPrecoChange(itemIndex: number): void {
    this.updateItemSubtotal(itemIndex);
  }

  private updateItemSubtotal(itemIndex: number): void {
    const itemGroup = this.itemsArray.at(itemIndex) as FormGroup;
    const quantidade = Number(itemGroup.get('quantidade')?.value) || 0;
    const precoUnitario = Number(itemGroup.get('precoUnitario')?.value) || 0;
    const subtotal = quantidade * precoUnitario;

    itemGroup.get('subtotal')?.setValue(subtotal);

    // Atualizar totais gerais
    this.updateTotals();
  }

  private updateTotals(): void {
    try {
      if (!this.vendaForm?.get('items')) return;

      // Calcular subtotal
      const items = this.vendaForm.get('items')?.value || [];
      const novoSubtotal = items.reduce((sum: number, item: any) => {
        const quantidade = Number(item?.quantidade) || 0;
        const precoUnitario = Number(item?.precoUnitario) || 0;
        return sum + (quantidade * precoUnitario);
      }, 0);

      // Calcular total
      const desconto = Number(this.vendaForm.get('desconto')?.value) || 0;
      const novoTotal = Math.max(0, novoSubtotal - desconto);

      // Atualizar signals
      this.subtotalValue.set(novoSubtotal);
      this.totalValue.set(novoTotal);

      console.log('Totais atualizados:', { subtotal: novoSubtotal, total: novoTotal });
    } catch (error) {
      console.error('Erro ao atualizar totais:', error);
    }
  }

  // Método para recalcular todos os subtotais dos itens
  private recalcularTodosSubtotais(): void {
    for (let i = 0; i < this.itemsArray.length; i++) {
      this.updateItemSubtotal(i);
    }
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  displayClienteFn = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.nome || '';
  };

  displayProdutoFn = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.name || '';
  };

  // Método para quando o usuário seleciona uma opção do autocomplete de cliente
  onClienteOptionSelected(event: any): void {
    const cliente = event.option.value;
    console.log('Cliente selecionado via option:', cliente);
    if (cliente && typeof cliente === 'object') {
      this.vendaForm.patchValue({
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        clienteEmail: cliente.email
      });
    }
  }

  // Método para quando o usuário foca no campo de cliente
  onClienteFocus(): void {
    const clienteNomeControl = this.vendaForm.get('clienteNome');
    const currentValue = clienteNomeControl?.value;

    // Se o campo está vazio, mostra todos os clientes ao focar
    if (!currentValue || currentValue.trim() === '') {
      this.clientesFiltrados.set(this.clientes());
    }
  }

  // Método para quando o usuário digita no campo de cliente
  onClienteInput(event: any): void {
    const value = event.target.value;
    if (value && value.trim() !== '') {
      // Filtra conforme digita
      const clientes = this.filtrarClientes(value);
      this.clientesFiltrados.set(clientes);
    } else {
      // Se limpar o campo, mostra todos novamente
      this.clientesFiltrados.set(this.clientes());
    }
  }

  // Método para quando o usuário digita no campo de produto
  onProdutoInput(event: any): void {
    const value = event.target.value;
    if (value && value.trim() !== '') {
      // Filtra conforme digita
      const produtos = this.filtrarProdutos(value);
      this.produtosFiltrados.set(produtos);
    } else {
      // Se limpar o campo, mostra todos novamente
      this.produtosFiltrados.set(this.produtos());
    }
  }

  // Método para quando o usuário seleciona uma opção do autocomplete de produto
  onProdutoOptionSelected(event: any, itemIndex: number): void {
    const produto = event.option.value;
    console.log('Produto selecionado via option:', produto, 'para item:', itemIndex);
    if (produto && typeof produto === 'object') {
      const itemGroup = this.itemsArray.at(itemIndex) as FormGroup;
      itemGroup.patchValue({
        produtoId: produto.id,
        produtoNome: produto.name,
        produtoSku: produto.sku,
        precoUnitario: produto.price
      });
      this.updateItemSubtotal(itemIndex);
    }
  }

  getFieldErrorMessage(fieldName: string, displayName: string): string {
    const field = this.vendaForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${displayName} é obrigatório`;
    }
    if (field?.hasError('min')) {
      return `${displayName} deve ser maior que ${field.errors?.['min'].min}`;
    }
    if (field?.hasError('email')) {
      return `${displayName} deve ter um formato válido`;
    }
    return '';
  }

  onSubmit(): void {
    if (this.vendaForm.valid) {
      const formValue = this.vendaForm.value;
      console.log('Form value:', formValue);

      if (this.editMode) {
        const vendaAtualizada: Venda = {
          ...formValue,
          subtotal: this.subtotal,
          total: this.total,
          ultimaAtualizacao: new Date()
        };
        this.dialogRef.close(vendaAtualizada);
      } else {
        const novaVenda: VendaCreate = {
          clienteId: formValue.clienteId,
          items: formValue.items.map((item: any) => ({
            produtoId: item.produtoId,
            produtoNome: item.produtoNome,
            produtoSku: item.produtoSku,
            quantidade: Number(item.quantidade),
            precoUnitario: Number(item.precoUnitario),
            subtotal: Number(item.quantidade) * Number(item.precoUnitario)
          })),
          desconto: Number(formValue.desconto) || 0,
          formaPagamento: formValue.formaPagamento,
          observacoes: formValue.observacoes || undefined,
          dataVencimento: formValue.dataVencimento || undefined
        };

        console.log('Nova venda a ser criada:', novaVenda);
        this.dialogRef.close(novaVenda);
      }
    } else {
      console.log('Form inválido:', this.vendaForm.errors);
      console.log('Controles inválidos:');
      Object.keys(this.vendaForm.controls).forEach(key => {
        const control = this.vendaForm.get(key);
        if (control?.invalid) {
          console.log(`${key}:`, control.errors);
        }
      });
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.vendaForm.controls).forEach(key => {
      const control = this.vendaForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            Object.keys(arrayControl.controls).forEach(subKey => {
              arrayControl.get(subKey)?.markAsTouched();
            });
          }
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    // Limpar classes CSS ao destruir o componente
    this.renderer.removeClass(this.elementRef.nativeElement, 'autocomplete-open');
  }

  // Métodos para controlar rolagem quando autocomplete está aberto
  onClienteAutocompleteOpened(): void {
    this.clienteAutoCompleteOpen.set(true);
    this.renderer.addClass(this.elementRef.nativeElement, 'autocomplete-open');
  }

  onClienteAutocompleteClosed(): void {
    this.clienteAutoCompleteOpen.set(false);
    if (!this.produtoAutoCompleteOpen()) {
      this.renderer.removeClass(this.elementRef.nativeElement, 'autocomplete-open');
    }
  }

  onProdutoAutocompleteOpened(): void {
    this.produtoAutoCompleteOpen.set(true);
    this.renderer.addClass(this.elementRef.nativeElement, 'autocomplete-open');
    // Carregar produtos quando o autocomplete for aberto manualmente
    if (this.produtosFiltrados().length === 0) {
      this.produtosFiltrados.set(this.produtos());
    }
  }

  onProdutoAutocompleteClosed(): void {
    this.produtoAutoCompleteOpen.set(false);
    if (!this.clienteAutoCompleteOpen()) {
      this.renderer.removeClass(this.elementRef.nativeElement, 'autocomplete-open');
    }
  }

  private disableBodyScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  private enableBodyScroll(): void {
    document.body.style.overflow = '';
  }
}
