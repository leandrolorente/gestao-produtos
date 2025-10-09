import { Directive, ElementRef, HostListener, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[telefoneMask]',
  standalone: true
})
export class TelefoneMaskDirective {

  constructor(
    private el: ElementRef,
    @Optional() private control: NgControl
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length <= 10) {
      // (00) 0000-0000
      value = value.replace(/(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      // (00) 00000-0000
      value = value.replace(/(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{5})(\d)/, '$1-$2');
    }

    input.value = value;

    // Atualiza FormControl com valor formatado
    if (this.control?.control) {
      this.control.control.setValue(value, { emitEvent: false });
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    this.onInput(event);
  }
}
