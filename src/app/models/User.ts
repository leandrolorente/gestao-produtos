export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  avatar?: string;
  department: string;
  lastLogin?: Date;
  isActive: boolean;
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