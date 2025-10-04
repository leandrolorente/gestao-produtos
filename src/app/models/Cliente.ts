// Interface para o endereço do cliente
export interface EnderecoCliente {
  id?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  unidade?: string;
  bairro: string;
  localidade: string; // cidade
  uf: string; // estado (sigla)
  estado: string; // nome completo do estado
  regiao?: string;
  referencia?: string;
  isPrincipal: boolean;
  tipo?: string;
  ativo?: boolean;
  dataCriacao?: Date;
  dataAtualizacao?: Date;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpfCnpj: string;
  endereco: EnderecoCliente;
  tipo: 'Pessoa Física' | 'Pessoa Jurídica';
  ativo: boolean;
  dataCadastro: Date;
  ultimaCompra?: Date;
  observacoes?: string;
}
