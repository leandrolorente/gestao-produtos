/**
 * Enums para Contas a Pagar
 */
export enum StatusContaPagar {
  Pendente = 1,
  Paga = 2,
  Cancelada = 3,
  Vencida = 4,
  PagamentoParcial = 5
}

export enum CategoriaConta {
  Fornecedores = 1,
  Funcionarios = 2,
  Impostos = 3,
  Aluguel = 4,
  Energia = 5,
  Telefone = 6,
  Internet = 7,
  Marketing = 8,
  Manutencao = 9,
  Combustivel = 10,
  Outros = 99
}

export enum TipoRecorrencia {
  Semanal = 1,
  Quinzenal = 2,
  Mensal = 3,
  Bimestral = 4,
  Trimestral = 5,
  Anual = 6
}

export enum FormaPagamento {
  Dinheiro = 1,
  CartaoCredito = 2,
  CartaoDebito = 3,
  PIX = 4,
  Boleto = 5,
  Transferencia = 6,
  Cheque = 7
}

/**
 * Interface base para dados de conta a pagar
 */
export interface ContaPagarBase {
  descricao: string;
  fornecedorId?: string;
  fornecedorNome?: string;
  compraId?: string;
  notaFiscal?: string;
  valorOriginal: number;
  desconto: number;
  dataEmissao: string;
  dataVencimento: string;
  categoria: CategoriaConta;
  ehRecorrente: boolean;
  tipoRecorrencia?: TipoRecorrencia;
  diasRecorrencia?: number;
  observacoes?: string;
  centroCusto?: string;
}

/**
 * Interface completa da conta a pagar (retorno da API)
 */
export interface ContaPagar extends ContaPagarBase {
  id: string;
  numero: string;
  valorPago: number;
  valorRestante: number;
  juros: number;
  multa: number;
  dataPagamento?: string;
  status: StatusContaPagar;
  formaPagamento?: FormaPagamento;
  estaVencida: boolean;
  diasVencimento: number;
  dataCriacao: string;
  dataAtualizacao: string;
}

/**
 * DTO para criação de conta a pagar
 */
export interface CreateContaPagar extends ContaPagarBase {}

/**
 * DTO para atualização de conta a pagar
 */
export interface UpdateContaPagar extends ContaPagarBase {
  id: string;
}

// Aliases para compatibilidade
export type ContaPagarCreateDTO = CreateContaPagar;
export type ContaPagarUpdateDTO = UpdateContaPagar;

/**
 * DTO para pagamento
 */
export interface PagamentoConta {
  valor: number;
  formaPagamento: FormaPagamento;
  dataPagamento?: string; // Opcional - padrão é agora
  observacoes?: string; // Campo observações do pagamento
}

/**
 * DTO para totalizadores
 */
export interface TotalContaPagar {
  total: number;
  periodo: string;
}

/**
 * DTO para quantidade
 */
export interface QuantidadeVencidas {
  quantidade: number;
}

/**
 * Interface para resumo de conta
 */
export interface ResumoContaPagar {
  totalPendente: number;
  totalPago: number;
  totalVencido: number;
  quantidadePendente: number;
  quantidadePaga: number;
  quantidadeVencida: number;
}
