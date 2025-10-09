import { Directive, ElementRef, HostListener, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[currencyMask]',
  standalone: true
})
export class CurrencyMaskDirective {

  constructor(
    private el: ElementRef,
    @Optional() private control: NgControl
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    // Remove zeros à esquerda, mas mantém pelo menos um dígito
    value = value.replace(/^0+/, '') || '0';

    // Converte para número e divide por 100 para ter duas casas decimais
    const numberValue = parseInt(value) / 100;

    // Formata como moeda brasileira
    const formattedValue = this.formatCurrency(numberValue);

    input.value = formattedValue;

    // Atualiza FormControl com o valor numérico
    if (this.control?.control) {
      this.control.control.setValue(numberValue, { emitEvent: false });
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    this.onInput(event);
  }

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    // Permite apenas dígitos
    if (!/\d/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(event.key)) {
      event.preventDefault();
    }
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
