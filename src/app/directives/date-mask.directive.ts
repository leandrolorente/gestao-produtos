import { Directive, ElementRef, HostListener, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[dateMask]',
  standalone: true
})
export class DateMaskDirective {

  constructor(
    private el: ElementRef,
    @Optional() private control: NgControl
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    // Limita a 8 dígitos (ddmmaaaa)
    if (value.length > 8) {
      value = value.substring(0, 8);
    }

    // Aplica máscara dd/mm/aaaa
    if (value.length >= 3) {
      value = value.replace(/(\d{2})(\d)/, '$1/$2');
    }
    if (value.length >= 6) {
      value = value.replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
    }

    input.value = value;

    // Atualiza FormControl com valor formatado
    if (this.control?.control) {
      this.control.control.setValue(value, { emitEvent: false });
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Valida data se estiver completa
    if (value.length === 10) {
      const [day, month, year] = value.split('/').map(Number);
      const date = new Date(year, month - 1, day);

      if (date.getFullYear() !== year ||
          date.getMonth() !== month - 1 ||
          date.getDate() !== day) {
        // Data inválida - limpa o campo
        input.value = '';
        if (this.control?.control) {
          this.control.control.setValue('', { emitEvent: false });
        }
      }
    }
  }

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    // Permite apenas dígitos
    if (!/\d/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(event.key)) {
      event.preventDefault();
    }
  }
}
