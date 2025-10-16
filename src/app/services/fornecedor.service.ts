import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Fornecedor,
  FornecedorList,
  CreateFornecedor,
  UpdateFornecedor,
  CondicoesComerciais,
  RegistroCompra,
  BloqueioFornecedor,
  TipoFornecedor,
  StatusFornecedor
} from '../models/Fornecedor';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FornecedorService {
  private readonly apiUrl = `${environment.apiUrl}/fornecedores`;

  constructor(private http: HttpClient) {}

  /**
   * Obtém todos os fornecedores (completo)
   */
  getAll(): Observable<Fornecedor[]> {
    return this.http.get<Fornecedor[]>(this.apiUrl);
  }

  /**
   * Obtém lista simplificada de fornecedores
   */
  getList(): Observable<FornecedorList[]> {
    return this.http.get<FornecedorList[]>(`${this.apiUrl}/list`);
  }

  /**
   * Obtém um fornecedor por ID
   */
  getById(id: string): Observable<Fornecedor> {
    return this.http.get<Fornecedor>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtém fornecedor por CNPJ/CPF
   */
  getByCnpj(cnpjCpf: string): Observable<Fornecedor> {
    return this.http.get<Fornecedor>(`${this.apiUrl}/cnpj/${cnpjCpf}`);
  }

  /**
   * Busca fornecedores por termo
   */
  buscar(termo: string): Observable<Fornecedor[]> {
    const params = new HttpParams().set('termo', termo);
    return this.http.get<Fornecedor[]>(`${this.apiUrl}/buscar`, { params });
  }

  /**
   * Obtém fornecedores por tipo
   */
  getByTipo(tipo: TipoFornecedor): Observable<Fornecedor[]> {
    return this.http.get<Fornecedor[]>(`${this.apiUrl}/tipo/${tipo}`);
  }

  /**
   * Obtém fornecedores por status
   */
  getByStatus(status: StatusFornecedor): Observable<Fornecedor[]> {
    return this.http.get<Fornecedor[]>(`${this.apiUrl}/status/${status}`);
  }

  /**
   * Obtém fornecedores com compra recente
   */
  getComCompraRecente(dias: number = 90): Observable<Fornecedor[]> {
    const params = new HttpParams().set('dias', dias.toString());
    return this.http.get<Fornecedor[]>(`${this.apiUrl}/compra-recente`, { params });
  }

  /**
   * Obtém fornecedores frequentes
   */
  getFrequentes(): Observable<Fornecedor[]> {
    return this.http.get<Fornecedor[]>(`${this.apiUrl}/frequentes`);
  }

  /**
   * Obtém fornecedores de um produto
   */
  getByProduto(produtoId: string): Observable<Fornecedor[]> {
    return this.http.get<Fornecedor[]>(`${this.apiUrl}/produto/${produtoId}`);
  }

  /**
   * Cria um novo fornecedor
   */
  create(fornecedor: CreateFornecedor): Observable<Fornecedor> {
    console.log('📤 Enviando POST para:', this.apiUrl);
    console.log('📦 Payload:', JSON.stringify(fornecedor, null, 2));
    return this.http.post<Fornecedor>(this.apiUrl, fornecedor);
  }

  /**
   * Atualiza um fornecedor
   */
  update(id: string, fornecedor: UpdateFornecedor): Observable<Fornecedor> {
    console.log('📤 Enviando PUT para:', `${this.apiUrl}/${id}`);
    console.log('📦 Payload:', JSON.stringify(fornecedor, null, 2));
    return this.http.put<Fornecedor>(`${this.apiUrl}/${id}`, fornecedor);
  }

  /**
   * Remove um fornecedor (soft delete)
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Bloqueia um fornecedor
   */
  bloquear(id: string, bloqueio: BloqueioFornecedor): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/bloquear`, bloqueio);
  }

  /**
   * Desbloqueia um fornecedor
   */
  desbloquear(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/desbloquear`, {});
  }

  /**
   * Inativa um fornecedor
   */
  inativar(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/inativar`, {});
  }

  /**
   * Ativa um fornecedor
   */
  ativar(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/ativar`, {});
  }

  /**
   * Adiciona produto ao fornecedor
   */
  adicionarProduto(fornecedorId: string, produtoId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${fornecedorId}/produtos/${produtoId}`, {});
  }

  /**
   * Remove produto do fornecedor
   */
  removerProduto(fornecedorId: string, produtoId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${fornecedorId}/produtos/${produtoId}`);
  }

  /**
   * Registra uma compra
   */
  registrarCompra(fornecedorId: string, compra: RegistroCompra): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${fornecedorId}/compras`, compra);
  }

  /**
   * Atualiza condições comerciais
   */
  atualizarCondicoesComerciais(fornecedorId: string, condicoes: CondicoesComerciais): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${fornecedorId}/condicoes-comerciais`, condicoes);
  }
}
