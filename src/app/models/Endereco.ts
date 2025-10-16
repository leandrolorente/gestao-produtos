/**
 * Tipos de endereço
 */
export enum TipoEndereco {
  Residencial = 1,
  Comercial = 2,
  Cobranca = 3,
  Entrega = 4,
  Outro = 5
}

/**
 * Interface completa de endereço
 */
export interface Endereco {
  id: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  referencia?: string;
  isPrincipal: boolean;
  tipo: TipoEndereco;
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
}

/**
 * DTO para criação de endereço
 */
export interface CreateEndereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  referencia?: string;
  isPrincipal: boolean;
  tipo: TipoEndereco;
}

/**
 * Response da API ViaCEP
 */
export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}
