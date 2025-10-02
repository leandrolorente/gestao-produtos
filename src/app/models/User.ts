export interface User {
  id: string; // Mudado para string para compatibilidade com MongoDB ObjectId
  name: string;
  email: string;
  password?: string; // Optional para edição (não deve ser exibida)
  avatar: string;
  department: string;
  lastUpdated?: Date;
  role: 'admin' | 'manager' | 'user';
  isActive: boolean;
  lastLogin?: Date;
}

// Interface para criação/edição (sem ID)
export interface UserCreate {
  name: string;
  email: string;
  password: string;
  avatar: string;
  department: string;
}

// Interface para resposta da API
export interface UserResponse {
  id: string; // Mudado para string para compatibilidade com MongoDB ObjectId
  name: string;
  email: string;
  avatar: string;
  department: string;
  role: 'admin' | 'manager' | 'user';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalValue: number;
  totalSales: number;
  totalRevenue: number;
  salesToday: number;
  revenueToday: number;
  pendingSales: number;
  totalClients: number;
  activeClients: number;
  recentTransactions: number;
  pendingOrders: number;
  topSellingProducts: ProductSummary[];
  recentSales: SaleSummary[];
}

export interface ProductSummary {
  id: string;
  name: string;
  quantity: number;
  sales: number;
  revenue: number;
}

export interface SaleSummary {
  id: string;
  numero: string;
  clienteNome: string;
  total: number;
  status: string;
  dataVenda: string;
}

export interface WidgetsData {
  vendas: {
    total: number;
    hoje: number;
    pendentes: number;
  };
  receita: {
    total: number;
    hoje: number;
    mes: number;
    crescimentoDiario: number;
  };
  produtos: {
    total: number;
    estoqueBaixo: number;
    valorTotal: number;
  };
  clientes: {
    total: number;
    ativos: number;
  };
}

export interface RevenueData {
  periodo: {
    inicio: string;
    fim: string;
  };
  receita: number;
  totalVendas: number;
  receitaMedia: number;
}
