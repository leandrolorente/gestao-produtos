import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { Cliente } from '../models/Cliente';

export interface ClienteCreateDto {
  nome: string;
  email: string;
  telefone?: string;
  cpfCnpj: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  tipo: 'Pessoa Física' | 'Pessoa Jurídica';
  observacoes?: string;
}

export interface ClienteUpdateDto extends Partial<ClienteCreateDto> {
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService extends BaseApiService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public readonly loading$ = this.loadingSubject.asObservable();
  
  // Signal para armazenar os clientes localmente
  private readonly clientesSignal = signal<Cliente[]>([]);
  public readonly clientes = this.clientesSignal.asReadonly();

  // Dados mockados para fallback (comentados para uso posterior se necessário)
  /*
  private readonly MOCK_CLIENTES: Cliente[] = [
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
    // ... outros clientes mockados
  ];
  */

  /**
   * Busca todos os clientes
   */
  getAllClientes(): Observable<Cliente[]> {
    this.loadingSubject.next(true);
    
    return this.http.get<Cliente[]>(this.buildUrl('clientes'), this.httpOptions)
      .pipe(
        tap(clientes => {
          // Se a API retornar lista vazia, usa dados mockados para demonstração
          if (clientes.length === 0) {
            const mockClientes = this.getMockClientes();
            this.clientesSignal.set(mockClientes);
          } else {
            this.clientesSignal.set(clientes);
          }
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          console.error('Erro ao buscar clientes:', error);
          this.loadingSubject.next(false);
          // Em caso de erro, usa dados mockados como fallback
          const mockClientes = this.getMockClientes();
          this.clientesSignal.set(mockClientes);
          return this.handleError(error);
        })
      );
  }

  /**
   * Retorna dados mockados para demonstração
   */
  private getMockClientes(): Cliente[] {
    return [
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
      }
    ];
  }

  /**
   * Busca um cliente por ID
   */
  getClienteById(id: number): Observable<Cliente> {
    this.loadingSubject.next(true);
    
    return this.http.get<Cliente>(this.buildUrl(`clientes/${id}`), this.httpOptions)
      .pipe(
        tap(() => this.loadingSubject.next(false)),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Cria um novo cliente
   */
  createCliente(cliente: ClienteCreateDto): Observable<Cliente> {
    this.loadingSubject.next(true);
    
    return this.http.post<Cliente>(this.buildUrl('clientes'), cliente, this.httpOptions)
      .pipe(
        tap(newCliente => {
          // Atualiza a lista local
          const currentClientes = this.clientesSignal();
          this.clientesSignal.set([...currentClientes, newCliente]);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Atualiza um cliente existente
   */
  updateCliente(cliente: ClienteUpdateDto): Observable<Cliente> {
    this.loadingSubject.next(true);
    
    return this.http.put<Cliente>(this.buildUrl(`clientes/${cliente.id}`), cliente, this.httpOptions)
      .pipe(
        tap(updatedCliente => {
          // Atualiza a lista local
          const currentClientes = this.clientesSignal();
          const index = currentClientes.findIndex(c => c.id === updatedCliente.id);
          if (index !== -1) {
            const updatedClientes = [...currentClientes];
            updatedClientes[index] = updatedCliente;
            this.clientesSignal.set(updatedClientes);
          }
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Remove um cliente
   */
  deleteCliente(id: number): Observable<void> {
    this.loadingSubject.next(true);
    
    return this.http.delete<void>(this.buildUrl(`clientes/${id}`), this.httpOptions)
      .pipe(
        tap(() => {
          // Remove da lista local
          const currentClientes = this.clientesSignal();
          const filteredClientes = currentClientes.filter(c => c.id !== id);
          this.clientesSignal.set(filteredClientes);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Busca clientes com filtros
   */
  searchClientes(filters?: { 
    nome?: string; 
    email?: string; 
    cpfCnpj?: string;
    tipo?: 'Pessoa Física' | 'Pessoa Jurídica';
    ativo?: boolean;
  }): Observable<Cliente[]> {
    this.loadingSubject.next(true);
    const params = this.buildParams(filters);
    
    return this.http.get<Cliente[]>(this.buildUrl('clientes'), { 
      ...this.httpOptions, 
      params 
    }).pipe(
      tap(clientes => {
        this.clientesSignal.set(clientes);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Ativa/desativa um cliente
   */
  toggleClienteStatus(id: number, ativo: boolean): Observable<Cliente> {
    this.loadingSubject.next(true);
    
    return this.http.patch<Cliente>(
      this.buildUrl(`clientes/${id}/status`), 
      { ativo }, 
      this.httpOptions
    ).pipe(
      tap(updatedCliente => {
        // Atualiza a lista local
        const currentClientes = this.clientesSignal();
        const index = currentClientes.findIndex(c => c.id === updatedCliente.id);
        if (index !== -1) {
          const updatedClientes = [...currentClientes];
          updatedClientes[index] = updatedCliente;
          this.clientesSignal.set(updatedClientes);
        }
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }
}