import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
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
  ativo?: boolean;
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

  /**
   * Converte dados da API (tipo numérico) para formato interno (tipo string)
   */
  private convertFromApi(cliente: any): Cliente {
    return {
      ...cliente,
      tipo: cliente.tipo === 1 ? 'Pessoa Física' : 'Pessoa Jurídica',
      dataCadastro: new Date(cliente.dataCadastro),
      ultimaCompra: cliente.ultimaCompra ? new Date(cliente.ultimaCompra) : undefined
    };
  }

  /**
   * Busca todos os clientes
   */
  getAllClientes(): Observable<Cliente[]> {
    this.loadingSubject.next(true);

    return this.http.get<any[]>(this.buildUrl('clientes'), this.httpOptions)
      .pipe(
        tap(clientes => {
          // Converte os dados da API para o formato interno
          const clientesConvertidos = clientes.map(cliente => this.convertFromApi(cliente));
          this.clientesSignal.set(clientesConvertidos);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          console.error('Erro ao buscar clientes:', error);
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
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

    // Converte os dados para o formato esperado pela API
    const clienteForApi = {
      ...cliente,
      tipo: cliente.tipo === 'Pessoa Física' ? 1 : 2 // Converte string para número
    };

    return this.http.post<any>(this.buildUrl('clientes'), clienteForApi, this.httpOptions)
      .pipe(
        tap(newClienteApi => {
          // Converte e atualiza a lista local
          const newCliente = this.convertFromApi(newClienteApi);
          const currentClientes = this.clientesSignal();
          this.clientesSignal.set([...currentClientes, newCliente]);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          console.error('Erro ao criar cliente na API:', error);
          this.loadingSubject.next(false);

          // Fallback: cria cliente localmente quando API falha
          const novoCliente: Cliente = {
            id: new Date().getTime(), // ID temporário
            nome: cliente.nome,
            email: cliente.email,
            telefone: cliente.telefone || '',
            cpfCnpj: cliente.cpfCnpj,
            endereco: cliente.endereco || '',
            cidade: cliente.cidade || '',
            estado: cliente.estado || '',
            cep: cliente.cep || '',
            tipo: cliente.tipo,
            ativo: true,
            observacoes: cliente.observacoes || '',
            dataCadastro: new Date()
          };

          // Atualiza a lista local com o cliente criado
          const currentClientes = this.clientesSignal();
          this.clientesSignal.set([...currentClientes, novoCliente]);

          return of(novoCliente);
        })
      );
  }  /**
   * Atualiza um cliente existente
   */
  updateCliente(cliente: ClienteUpdateDto): Observable<Cliente> {
    this.loadingSubject.next(true);

    // Converte os dados para o formato esperado pela API se o tipo estiver presente
    const clienteForApi = {
      ...cliente,
      ...(cliente.tipo && { tipo: cliente.tipo === 'Pessoa Física' ? 1 : 2 })
    };

    return this.http.put<any>(this.buildUrl(`clientes/${cliente.id}`), clienteForApi, this.httpOptions)
      .pipe(
        tap(updatedClienteApi => {
          // Converte e atualiza a lista local
          const updatedCliente = this.convertFromApi(updatedClienteApi);
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
