// Reutilizando enums de FormaPagamento e TipoRecorrencia da ContaPagar
import { FormaPagamento, TipoRecorrencia } from './ContaPagar';

/**
 * Enums para Contas a Receber
 */
export enum StatusContaReceber {
  Pendente = 1,
  Recebida = 2,
  Cancelada = 3,
  Vencida = 4,
  RecebimentoParcial = 5
}

/**
 * Interface base para dados de conta a receber
 */
export interface ContaReceberBase {
  descricao: string;
  clienteId?: string;
  clienteNome?: string;
  vendaId?: string;
  notaFiscal?: string;
  valorOriginal: number;
  desconto: number;
  dataEmissao: string;
  dataVencimento: string;
  ehRecorrente: boolean;
  tipoRecorrencia?: TipoRecorrencia;
  observacoes?: string;
  vendedorId?: string;
  vendedorNome?: string;
}

/**
 * Interface completa da conta a receber (retorno da API)
 */
export interface ContaReceber extends ContaReceberBase {
  id: string;
  numero: string;
  valorRecebido: number;
  valorRestante: number;
  juros: number;
  multa: number;
  dataRecebimento?: string;
  status: StatusContaReceber;
  formaPagamento?: FormaPagamento;
  estaVencida: boolean;
  diasVencimento: number;
  dataCriacao: string;
  dataAtualizacao: string;
}

/**
 * DTO para criação de conta a receber
 */
export interface CreateContaReceber extends ContaReceberBase {}

/**
 * DTO para atualização de conta a receber
 */
export interface UpdateContaReceber extends ContaReceberBase {
  id: string;
}

/**
 * DTO para recebimento
 */
export interface RecebimentoConta {
  valor: number;
  formaPagamento: FormaPagamento;
  dataRecebimento: string;
}

/**
 * DTO para totalizadores
 */
export interface TotalContaReceber {
  total: number;
  periodo: string;
}

/**
 * Interface para resumo de conta
 */
export interface ResumoContaReceber {
  totalPendente: number;
  totalRecebido: number;
  totalVencido: number;
  quantidadePendente: number;
  quantidadeRecebida: number;
  quantidadeVencida: number;
}
