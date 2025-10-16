// src/app/models/FiltroRelatorio.ts
export interface FiltroRelatorio {
  campo: string;
  valor?: string;
  tipo?: 'text' | 'select' | 'date' | 'number' | 'checkbox';
  opcoes?: string[];
  label?: string;
}
