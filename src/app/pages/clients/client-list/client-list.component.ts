import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Cliente } from '../../../models/Cliente';
import { ClientDialogComponent } from '../../../components/client-dialog/client-dialog.component';

// Dados mock para demonstração
const CLIENTES_DATA: Cliente[] = [
  {
    id: 1,
    nome: 'João Silva Santos',
    email: 'joao.silva@email.com',
    telefone: '(11) 99999-1234',
    cpfCnpj: '123.456.789-00',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    tipo: 'Pessoa Física',
    ativo: true,
    dataCadastro: new Date('2024-01-15'),
    ultimaCompra: new Date('2024-09-20'),
    observacoes: 'Cliente preferencial'
  },
  {
    id: 2,
    nome: 'Maria Oliveira',
    email: 'maria.oliveira@empresa.com',
    telefone: '(11) 88888-5678',
    cpfCnpj: '987.654.321-11',
    endereco: 'Av. Paulista, 456',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04567-890',
    tipo: 'Pessoa Física',
    ativo: true,
    dataCadastro: new Date('2024-02-10'),
    ultimaCompra: new Date('2024-09-25')
  },
  {
    id: 3,
    nome: 'Empresa ABC Ltda',
    email: 'contato@empresaabc.com.br',
    telefone: '(11) 3333-4444',
    cpfCnpj: '12.345.678/0001-90',
    endereco: 'Rua Comercial, 789',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '05678-123',
    tipo: 'Pessoa Jurídica',
    ativo: true,
    dataCadastro: new Date('2024-03-05'),
    ultimaCompra: new Date('2024-09-18'),
    observacoes: 'Cliente corporativo - desconto especial'
  },
  {
    id: 4,
    nome: 'Carlos Mendes',
    email: 'carlos.mendes@gmail.com',
    telefone: '(21) 77777-9999',
    cpfCnpj: '456.789.123-22',
    endereco: 'Rua do Sol, 321',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: '20123-456',
    tipo: 'Pessoa Física',
    ativo: false,
    dataCadastro: new Date('2023-12-20'),
    ultimaCompra: new Date('2024-06-10'),
    observacoes: 'Cliente inativo desde junho'
  },
  {
    id: 5,
    nome: 'Tech Solutions S.A.',
    email: 'vendas@techsolutions.com',
    telefone: '(11) 5555-6666',
    cpfCnpj: '98.765.432/0001-10',
    endereco: 'Centro Empresarial, 1000',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-999',
    tipo: 'Pessoa Jurídica',
    ativo: true,
    dataCadastro: new Date('2024-04-12'),
    ultimaCompra: new Date('2024-09-22')
  }
];

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss'
})
export class ClientListComponent {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  protected readonly clientes = signal<Cliente[]>(CLIENTES_DATA);
  protected readonly clientesFiltrados = signal<Cliente[]>(CLIENTES_DATA);
  protected readonly searchTerm = signal<string>('');

  protected readonly displayedColumns: string[] = [
    'id',
    'nome',
    'email',
    'telefone',
    'cpfCnpj',
    'cidade',
    'tipo',
    'ativo',
    'ultimaCompra',
    'actions'
  ];

  protected applyFilter(): void {
    const term = this.searchTerm().toLowerCase();
    const filtered = this.clientes().filter(cliente =>
      cliente.nome.toLowerCase().includes(term) ||
      cliente.email.toLowerCase().includes(term) ||
      cliente.cpfCnpj.includes(term) ||
      cliente.cidade.toLowerCase().includes(term)
    );
    this.clientesFiltrados.set(filtered);
  }

  protected onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.applyFilter();
  }

  protected addCliente(): void {
    const dialogRef = this.dialog.open(ClientDialogComponent, {
      width: '600px',
      data: { cliente: null, isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newCliente: Cliente = {
          ...result,
          id: new Date().getTime(),
          dataCadastro: new Date(),
          ativo: true
        };
        
        const updatedClientes = [...this.clientes(), newCliente];
        this.clientes.set(updatedClientes);
        this.applyFilter();
        
        this.snackBar.open('Cliente adicionado com sucesso!', 'Fechar', {
          duration: 3000
        });
      }
    });
  }

  protected editCliente(cliente: Cliente): void {
    const dialogRef = this.dialog.open(ClientDialogComponent, {
      width: '600px',
      data: { cliente, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const updatedClientes = this.clientes().map(c =>
          c.id === cliente.id ? { ...result, id: cliente.id, dataCadastro: cliente.dataCadastro } : c
        );
        this.clientes.set(updatedClientes);
        this.applyFilter();
        
        this.snackBar.open('Cliente atualizado com sucesso!', 'Fechar', {
          duration: 3000
        });
      }
    });
  }

  protected deleteCliente(cliente: Cliente): void {
    if (confirm(`Tem certeza que deseja excluir o cliente "${cliente.nome}"?`)) {
      const updatedClientes = this.clientes().filter(c => c.id !== cliente.id);
      this.clientes.set(updatedClientes);
      this.applyFilter();

      this.snackBar.open('Cliente excluído com sucesso!', 'Fechar', {
        duration: 3000
      });
    }
  }

  protected toggleClienteStatus(cliente: Cliente): void {
    const updatedClientes = this.clientes().map(c =>
      c.id === cliente.id ? { ...c, ativo: !c.ativo } : c
    );
    this.clientes.set(updatedClientes);
    this.applyFilter();

    const status = cliente.ativo ? 'desativado' : 'ativado';
    this.snackBar.open(`Cliente ${status} com sucesso!`, 'Fechar', {
      duration: 3000
    });
  }

  protected exportToCsv(): void {
    const csvData = this.clientesFiltrados().map(cliente => ({
      Nome: cliente.nome,
      Email: cliente.email,
      Telefone: cliente.telefone,
      'CPF/CNPJ': cliente.cpfCnpj,
      Endereço: cliente.endereco,
      Cidade: cliente.cidade,
      Estado: cliente.estado,
      CEP: cliente.cep,
      Tipo: cliente.tipo,
      Ativo: cliente.ativo ? 'Sim' : 'Não',
      'Data Cadastro': cliente.dataCadastro.toLocaleDateString('pt-BR'),
      'Última Compra': cliente.ultimaCompra?.toLocaleDateString('pt-BR') || '',
      Observações: cliente.observacoes || ''
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row]?.toString() || '';
          return value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
