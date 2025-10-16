import { Endereco } from './Endereco';

/**
 * Tipos de fornecedor
 */
export enum TipoFornecedor {
  Nacional = 1,
  Internacional = 2
}

/**
 * Status do fornecedor
 */
export enum StatusFornecedor {
  Ativo = 1,
  Inativo = 2,
  Bloqueado = 3
}

/**
 * Interface base para dados de fornecedor
 */
export interface FornecedorBase {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpjCpf: string;
  email: string;
  telefone: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  tipo: TipoFornecedor;
  observacoes?: string;
  contatoPrincipal?: string;
  site?: string;

  // Dados bancários
  banco?: string;
  agencia?: string;
  conta?: string;
  pix?: string;

  // Condições comerciais
  prazoPagamentoPadrao: number;
  limiteCredito: number;
  condicoesPagamento?: string;
}

/**
 * Interface completa do fornecedor (retorno da API)
 */
export interface Fornecedor extends FornecedorBase {
  id: string;
  endereco?: Endereco;
  status: StatusFornecedor;

  // Estatísticas
  quantidadeProdutos: number;
  ultimaCompra?: string;
  totalComprado: number;
  quantidadeCompras: number;
  ticketMedio: number;
  ehFrequente: boolean;

  // Auditoria
  dataCriacao: string;
  dataAtualizacao: string;
  ativo: boolean;
}

/**
 * DTO para listagem simplificada
 */
export interface FornecedorList {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpjCpf: string;
  email: string;
  telefone: string;
  tipo: TipoFornecedor;
  status: StatusFornecedor;
  contatoPrincipal?: string;
  ultimaCompra?: string;
  totalComprado: number;
  quantidadeCompras: number;
  ehFrequente: boolean;
  ativo: boolean;
}

/**
 * DTO para criação de fornecedor
 */
export interface CreateFornecedor extends FornecedorBase {
  endereco?: Omit<Endereco, 'id' | 'dataCriacao' | 'dataAtualizacao'>;
}

/**
 * DTO para atualização de fornecedor
 */
export interface UpdateFornecedor extends FornecedorBase {
  status: StatusFornecedor;
  endereco?: Omit<Endereco, 'id' | 'dataCriacao' | 'dataAtualizacao'>;
}

/**
 * DTO para condições comerciais
 */
export interface CondicoesComerciais {
  prazoPagamento: number;
  limiteCredito: number;
  condicoesPagamento?: string;
}

/**
 * DTO para registro de compra
 */
export interface RegistroCompra {
  valor: number;
}

/**
 * DTO para bloqueio de fornecedor
 */
export interface BloqueioFornecedor {
  motivo?: string;
}
