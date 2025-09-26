export interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpfCnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  tipo: 'Pessoa Física' | 'Pessoa Jurídica';
  ativo: boolean;
  dataCadastro: Date;
  ultimaCompra?: Date;
  observacoes?: string;
}