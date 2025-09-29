import { Component, EventEmitter, Output, Input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    ZXingScannerModule
  ],
  template: `
    <div class="scanner-container">
      <div class="scanner-header">
        <h2 mat-dialog-title>
          <mat-icon>qr_code_scanner</mat-icon>
          Ler Código de Barras
        </h2>
        <button
          mat-icon-button
          (click)="onCancel()"
          class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="scanner-content" mat-dialog-content>
        <div class="camera-container" *ngIf="!isLoading() && hasDevices(); else loadingTemplate">
          <zxing-scanner
            #scanner
            [enable]="scannerEnabled()"
            [formats]="allowedFormats"
            (scanSuccess)="onCodeResult($event)"
            (scanError)="onScanError($event)"
            (hasDevices)="onHasDevices($event)"
            class="barcode-scanner">
          </zxing-scanner>

          <div class="scanner-overlay">
            <div class="scanner-frame"></div>
            <p class="scanner-instruction">
              Posicione o código de barras dentro do quadro
            </p>
          </div>
        </div>

        <ng-template #loadingTemplate>
          <div class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p>{{ loadingMessage() }}</p>
          </div>
        </ng-template>

        <!-- Controles da câmera -->
        <div class="camera-controls" *ngIf="false">
          <!-- Removido temporariamente -->
        </div>

        <!-- Entrada manual -->
        <div class="manual-input">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Ou digite o código manualmente</mat-label>
            <input
              matInput
              [(ngModel)]="manualCode"
              placeholder="Digite o código de barras"
              (keyup.enter)="onManualSubmit()">
            <mat-icon matSuffix>keyboard</mat-icon>
          </mat-form-field>
        </div>
      </div>

      <div class="scanner-actions" mat-dialog-actions>
        <button
          mat-button
          (click)="onCancel()">
          Cancelar
        </button>
        <button
          mat-raised-button
          color="primary"
          (click)="onManualSubmit()"
          [disabled]="!manualCode">
          Usar Código Manual
        </button>
      </div>
    </div>
  `,
  styles: [`
    .scanner-container {
      width: 500px;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .scanner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;

      h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        color: var(--primary-color);

        mat-icon {
          font-size: 1.5rem;
        }
      }

      .close-button {
        color: var(--text-secondary);
      }
    }

    .scanner-content {
      flex: 1;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .camera-container {
      position: relative;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      height: 300px;
    }

    .barcode-scanner {
      width: 100%;
      height: 100%;
    }

    .scanner-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .scanner-frame {
      width: 250px;
      height: 100px;
      border: 2px solid var(--primary-color);
      border-radius: 8px;
      box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.5);
    }

    .scanner-instruction {
      color: white;
      margin-top: 16px;
      text-align: center;
      background: rgba(0, 0, 0, 0.7);
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
      height: 300px;

      p {
        margin-top: 16px;
        color: var(--text-secondary);
      }
    }

    .camera-controls {
      display: flex;
      justify-content: center;
    }

    .manual-input {
      .full-width {
        width: 100%;
      }
    }

    .scanner-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    @media (max-width: 600px) {
      .scanner-container {
        width: 100vw;
        height: 100vh;
        max-width: none;
        max-height: none;
      }

      .camera-container {
        height: 250px;
      }

      .scanner-frame {
        width: 200px;
        height: 80px;
      }
    }
  `]
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {
  @Output() barcodeDetected = new EventEmitter<string>();
  @Input() initialCode = '';

  protected readonly isLoading = signal(true);
  protected readonly scannerEnabled = signal(false);
  protected readonly hasDevices = signal(false);
  protected readonly loadingMessage = signal('Iniciando câmera...');

  protected manualCode = '';

  protected readonly allowedFormats = [
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.QR_CODE
  ];

  constructor(
    private dialogRef: MatDialogRef<BarcodeScannerComponent>
  ) {
    this.manualCode = this.initialCode;
  }

  ngOnInit(): void {
    this.initializeScanner();
  }

  ngOnDestroy(): void {
    this.scannerEnabled.set(false);
  }

  private async initializeScanner(): Promise<void> {
    try {
      this.loadingMessage.set('Solicitando permissão da câmera...');

      // Solicita permissão para câmera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Para o stream temporário

      this.loadingMessage.set('Carregando scanner...');

      // Aguarda um momento para que o scanner inicialize
      setTimeout(() => {
        this.scannerEnabled.set(true);
        this.isLoading.set(false);
      }, 1000);

    } catch (error) {
      console.error('Erro ao inicializar scanner:', error);
      this.loadingMessage.set('Erro ao acessar câmera. Use a entrada manual.');
      this.isLoading.set(false);
    }
  }

  protected onCodeResult(result: string): void {
    if (result && result.trim()) {
      this.barcodeDetected.emit(result.trim());
      this.dialogRef.close(result.trim());
    }
  }

  protected onScanError(error: any): void {
    console.warn('Erro de scan:', error);
  }

  protected onHasDevices(hasDevices: boolean): void {
    this.hasDevices.set(hasDevices);
    if (!hasDevices) {
      this.loadingMessage.set('Nenhuma câmera encontrada. Use a entrada manual.');
    }
  }

  protected onManualSubmit(): void {
    if (this.manualCode && this.manualCode.trim()) {
      const code = this.manualCode.trim();
      this.barcodeDetected.emit(code);
      this.dialogRef.close(code);
    }
  }

  protected onCancel(): void {
    this.dialogRef.close();
  }
}
