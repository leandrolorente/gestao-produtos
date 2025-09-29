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
  recentTransactions: number;
  pendingOrders: number;
  topSellingProducts: ProductSummary[];
}

export interface ProductSummary {
  id: number;
  name: string;
  quantity: number;
  sales: number;
}
