// Interfaces para integração com ViaCEP

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
}

export interface ValidacaoResponse {
  valido: boolean;
  cepFormatado?: string;
  message: string;
}

export interface ErrorResponse {
  message: string;
  details?: string;
}
