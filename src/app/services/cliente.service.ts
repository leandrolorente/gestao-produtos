import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { Cliente, EnderecoCliente } from '../models/Cliente';

// DTOs para criação (POST)
export interface ClienteCreateDto {
  nome: string;
  email: string;
  telefone?: string;
  cpfCnpj: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    unidade?: string;
    bairro: string;
    localidade: string;
    uf: string;
    estado: string;
    regiao?: string;
    referencia?: string;
    isPrincipal: boolean;
    tipo?: string;
  };
  tipo: number; // 1 = Pessoa Física, 2 = Pessoa Jurídica
  observacoes?: string;
}

// DTOs para atualização (PUT)
export interface ClienteUpdateDto {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpfCnpj: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    unidade?: string;
    bairro: string;
    localidade: string;
    uf: string;
    estado: string;
    regiao?: string;
    referencia?: string;
    isPrincipal: boolean;
    tipo?: string;
  };
  tipo: number; // 1 = Pessoa Física, 2 = Pessoa Jurídica
  observacoes?: string;
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
   * Converte dados da API (response GET) para formato interno
   */
  private convertFromApi(cliente: any): Cliente {
    console.log('🔄 Convertendo da API:', cliente);
    console.log('🔄 Endereço na API:', cliente.endereco);
    
    const converted = {
      ...cliente,
      id: cliente.id,
      tipo: cliente.tipo === 1 || cliente.tipo === 'Pessoa Física' ? 'Pessoa Física' : 'Pessoa Jurídica',
      endereco: {
        ...cliente.endereco,
        dataCriacao: cliente.endereco?.dataCriacao ? new Date(cliente.endereco.dataCriacao) : undefined,
        dataAtualizacao: cliente.endereco?.dataAtualizacao ? new Date(cliente.endereco.dataAtualizacao) : undefined,
      },
      dataCadastro: new Date(cliente.dataCadastro),
      ultimaCompra: cliente.ultimaCompra ? new Date(cliente.ultimaCompra) : undefined
    };
    
    console.log('✅ Cliente convertido:', converted);
    console.log('✅ Endereço convertido:', converted.endereco);
    
    return converted;
  }

  /**
   * Converte dados do formulário interno para formato da API (POST/PUT)
   */
  private convertToApi(cliente: any): ClienteCreateDto {
    return {
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      cpfCnpj: cliente.cpfCnpj,
      endereco: {
        cep: cliente.endereco?.cep || cliente.cep || '',
        logradouro: cliente.endereco?.logradouro || cliente.logradouro || '',
        numero: cliente.endereco?.numero || cliente.numero || '',
        complemento: cliente.endereco?.complemento || cliente.complemento || '',
        unidade: cliente.endereco?.unidade || '',
        bairro: cliente.endereco?.bairro || cliente.bairro || '',
        localidade: cliente.endereco?.localidade || cliente.localidade || '',
        uf: cliente.endereco?.uf || cliente.uf || '',
        estado: cliente.endereco?.estado || cliente.estado || '',
        regiao: cliente.endereco?.regiao || '',
        referencia: cliente.endereco?.referencia || '',
        isPrincipal: true,
        tipo: cliente.endereco?.tipo || 'residencial'
      },
      tipo: typeof cliente.tipo === 'string' 
        ? (cliente.tipo === 'Pessoa Física' ? 1 : 2)
        : cliente.tipo,
      observacoes: cliente.observacoes
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
  createCliente(dadosFormulario: any): Observable<Cliente> {
    this.loadingSubject.next(true);

    // Converte os dados do formulário para o formato da API
    const clienteForApi = this.convertToApi(dadosFormulario);

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
            id: Date.now().toString(), // ID temporário como string
            nome: dadosFormulario.nome,
            email: dadosFormulario.email,
            telefone: dadosFormulario.telefone || '',
            cpfCnpj: dadosFormulario.cpfCnpj,
            endereco: {
              cep: dadosFormulario.cep || '',
              logradouro: dadosFormulario.logradouro || '',
              numero: dadosFormulario.numero || '',
              complemento: dadosFormulario.complemento || '',
              bairro: dadosFormulario.bairro || '',
              localidade: dadosFormulario.localidade || '',
              uf: dadosFormulario.uf || '',
              estado: dadosFormulario.estado || '',
              isPrincipal: true
            },
            tipo: dadosFormulario.tipo || 'Pessoa Física',
            ativo: true,
            observacoes: dadosFormulario.observacoes || '',
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
  updateCliente(dadosFormulario: any): Observable<Cliente> {
    this.loadingSubject.next(true);

    // Converte os dados do formulário para o formato da API
    const clienteForApi: ClienteUpdateDto = {
      id: dadosFormulario.id,
      ...this.convertToApi(dadosFormulario)
    };

    return this.http.put<any>(this.buildUrl(`clientes/${dadosFormulario.id}`), clienteForApi, this.httpOptions)
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
  deleteCliente(id: string): Observable<void> {
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
  toggleClienteStatus(id: string, ativo: boolean): Observable<Cliente> {
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
