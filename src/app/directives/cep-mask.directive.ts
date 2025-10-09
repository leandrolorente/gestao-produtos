import { Directive, ElementRef, HostListener, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[cepMask]',
  standalone: true
})
export class CepMaskDirective {

  constructor(
    private el: ElementRef,
    @Optional() private control: NgControl
  ) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const currentValue = input.value.replace(/\D/g, '');

    // Permite teclas de controle
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Permite Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
    if (event.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(event.key.toLowerCase())) {
      return;
    }

    // Bloqueia se não for dígito
    if (!/\d/.test(event.key)) {
      event.preventDefault();
      return;
    }

    // Bloqueia se já tem 8 dígitos
    if (currentValue.length >= 8) {
      event.preventDefault();
      return;
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    // Limita a 8 dígitos
    if (value.length > 8) {
      value = value.substring(0, 8);
    }

    value = value.replace(/^(\d{5})(\d)/, '$1-$2');

    input.value = value;

    // Atualiza o FormControl com valor formatado
    if (this.control?.control) {
      this.control.control.setValue(value, { emitEvent: false });
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    // Reaplica a máscara no blur para garantir formatação correta
    this.onInput(event);
  }
}
