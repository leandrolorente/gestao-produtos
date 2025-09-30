export interface VendaItem {
  id: string;
  produtoId: string;
  produtoNome: string;
  produtoSku: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Venda {
  id: string;
  numero: string; // Número da venda (ex: VND-001)
  clienteId: string;
  clienteNome: string;
  clienteEmail: string;
  items: VendaItem[];
  subtotal: number;
  desconto: number;
  total: number;
  formaPagamento: 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX' | 'Boleto';
  status: 'Pendente' | 'Confirmada' | 'Cancelada' | 'Finalizada';
  observacoes?: string;
  dataVenda: Date;
  dataVencimento?: Date;
  vendedorId?: string;
  vendedorNome?: string;
  ultimaAtualizacao: Date;
}

// Interface para criação de venda (sem ID)
export interface VendaCreate {
  clienteId: string;
  items: Omit<VendaItem, 'id'>[];
  desconto?: number;
  formaPagamento: string;
  observacoes?: string;
  dataVencimento?: Date;
}

// Interface para resposta da API
export interface VendaResponse {
  id: string;
  numero: string;
  clienteId: string;
  clienteNome: string;
  clienteEmail: string;
  items: VendaItem[];
  subtotal: number;
  desconto: number;
  total: number;
  formaPagamento: string;
  status: string;
  observacoes?: string;
  dataVenda: string;
  dataVencimento?: string;
  vendedorId?: string;
  vendedorNome?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para estatísticas de vendas
export interface VendasStats {
  totalVendas: number;
  vendasHoje: number;
  faturamentoMes: number;
  ticketMedio: number;
  vendasPendentes: number;
  topClientes: Array<{
    clienteNome: string;
    totalCompras: number;
    valorTotal: number;
  }>;
  vendasPorMes: Array<{
    mes: string;
    vendas: number;
    faturamento: number;
  }>;
}
