import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { FiltroRelatorio } from '../../models/FiltroRelatorio';

export interface CampoFiltro {
  nome: string;
  label: string;
  tipo: 'text' | 'select' | 'date' | 'daterange' | 'number';
  opcoes?: { valor: any; label: string }[];
  valor?: any;
}

@Component({
  selector: 'app-filtros-relatorio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="filtros-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>filter_list</mat-icon>
          Filtros do Relatório
        </mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <form [formGroup]="filtroForm" class="filtros-form">
          <div class="filtros-grid">
            <!-- Filtro de Data Início -->
            <mat-form-field appearance="outline">
              <mat-label>Data Início</mat-label>
              <input matInput [matDatepicker]="dataInicioPicker" formControlName="dataInicio">
              <mat-datepicker-toggle matIconSuffix [for]="dataInicioPicker"></mat-datepicker-toggle>
              <mat-datepicker #dataInicioPicker></mat-datepicker>
            </mat-form-field>

            <!-- Filtro de Data Fim -->
            <mat-form-field appearance="outline">
              <mat-label>Data Fim</mat-label>
              <input matInput [matDatepicker]="dataFimPicker" formControlName="dataFim">
              <mat-datepicker-toggle matIconSuffix [for]="dataFimPicker"></mat-datepicker-toggle>
              <mat-datepicker #dataFimPicker></mat-datepicker>
            </mat-form-field>

            <!-- Campos dinâmicos -->
            @for (campo of campos; track campo.nome) {
              <!-- Campo de texto -->
              @if (campo.tipo === 'text') {
                <mat-form-field appearance="outline">
                  <mat-label>{{ campo.label }}</mat-label>
                  <input matInput [formControlName]="campo.nome" [placeholder]="campo.label">
                </mat-form-field>
              }

              <!-- Campo de número -->
              @if (campo.tipo === 'number') {
                <mat-form-field appearance="outline">
                  <mat-label>{{ campo.label }}</mat-label>
                  <input matInput type="number" [formControlName]="campo.nome" [placeholder]="campo.label">
                </mat-form-field>
              }

              <!-- Campo de seleção -->
              @if (campo.tipo === 'select') {
                <mat-form-field appearance="outline">
                  <mat-label>{{ campo.label }}</mat-label>
                  <mat-select [formControlName]="campo.nome">
                    <mat-option value="">Todos</mat-option>
                    @for (opcao of campo.opcoes; track opcao.valor) {
                      <mat-option [value]="opcao.valor">
                        {{ opcao.label }}
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              }

              <!-- Campo de data -->
              @if (campo.tipo === 'date') {
                <mat-form-field appearance="outline">
                  <mat-label>{{ campo.label }}</mat-label>
                  <input matInput [matDatepicker]="picker" [formControlName]="campo.nome">
                  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>
              }
            }
          </div>
        </form>
      </mat-card-content>

      <mat-card-actions align="end">
        <button mat-button (click)="limparFiltros()" type="button">
          <mat-icon>clear</mat-icon>
          Limpar
        </button>
        <button mat-raised-button color="primary" (click)="aplicarFiltros()" type="button">
          <mat-icon>search</mat-icon>
          Filtrar
        </button>
      </mat-card-actions>
    </mat-card>

    <!-- Filtros ativos -->
    @if (filtrosAtivos.length > 0) {
      <div class="filtros-ativos">
        <h4>Filtros Ativos:</h4>
        <mat-chip-set>
          @for (filtro of filtrosAtivos; track filtro.campo) {
            <mat-chip (removed)="removerFiltro(filtro.campo)">
              <strong>{{ filtro.label }}:</strong> {{ filtro.valor }}
              <button matChipRemove>
                <mat-icon>cancel</mat-icon>
              </button>
            </mat-chip>
          }
        </mat-chip-set>
      </div>
    }
  `,
  styles: [`
    .filtros-card {
      margin-bottom: 1.5rem;
    }

    .filtros-form {
      margin-top: 1rem;
    }

    .filtros-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      align-items: end;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .filtros-ativos {
      margin: 1rem 0;
      padding: 1rem;
      background-color: #f5f5f5;
      border-radius: 8px;
      border-left: 4px solid var(--primary-color);

      h4 {
        margin: 0 0 0.5rem 0;
        color: var(--primary-color);
        font-size: 0.9rem;
        font-weight: 600;
      }
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--primary-color);
    }

    mat-card-actions {
      padding-top: 1rem;
    }
  `]
})
export class FiltrosRelatorioComponent {
  @Input() campos: CampoFiltro[] = [];
  @Output() filtrosChange = new EventEmitter<FiltroRelatorio[]>();

  filtroForm: FormGroup;
  filtrosAtivos: { campo: string; label: string; valor: string }[] = [];

  constructor(private fb: FormBuilder) {
    this.filtroForm = this.fb.group({
      dataInicio: [''],
      dataFim: ['']
    });
  }

  ngOnInit() {
    // Adiciona campos dinâmicos ao formulário
    this.campos.forEach(campo => {
      this.filtroForm.addControl(campo.nome, this.fb.control(campo.valor || ''));
    });
  }

  aplicarFiltros() {
    const filtros = this.filtroForm.value;

    // Converte para array de filtros
    const filtrosArray: FiltroRelatorio[] = [];
    Object.keys(filtros).forEach(key => {
      if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
        let valor: string;
        if (filtros[key] instanceof Date) {
          valor = filtros[key].toISOString().split('T')[0];
        } else {
          valor = filtros[key].toString();
        }

        filtrosArray.push({
          campo: key,
          valor: valor
        });
      }
    });

    // Atualiza filtros ativos para exibição
    this.atualizarFiltrosAtivos(filtrosArray);

    this.filtrosChange.emit(filtrosArray);
  }

  limparFiltros() {
    this.filtroForm.reset();
    this.filtrosAtivos = [];
    this.filtrosChange.emit([]);
  }

  removerFiltro(campo: string) {
    this.filtroForm.patchValue({ [campo]: '' });
    this.aplicarFiltros();
  }

  private atualizarFiltrosAtivos(filtros: FiltroRelatorio[]) {
    this.filtrosAtivos = [];

    filtros.forEach(filtro => {
      let label = filtro.campo;
      let valor = filtro.valor || '';

      // Mapeia nomes de campos para labels amigáveis
      switch (filtro.campo) {
        case 'dataInicio':
          label = 'Data Início';
          break;
        case 'dataFim':
          label = 'Data Fim';
          break;
        default:
          // Busca label nos campos dinâmicos
          const campo = this.campos.find(c => c.nome === filtro.campo);
          if (campo) {
            label = campo.label;
            // Se é um select, busca o label da opção
            if (campo.tipo === 'select' && campo.opcoes) {
              const opcao = campo.opcoes.find(o => o.valor === filtro.valor);
              if (opcao) {
                valor = opcao.label;
              }
            }
          }
      }

      this.filtrosAtivos.push({ campo: filtro.campo, label, valor });
    });
  }
}
