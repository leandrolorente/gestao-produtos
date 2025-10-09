import { Directive, ElementRef, HostListener, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[ufMask]',
  standalone: true
})
export class UfMaskDirective {

  constructor(
    private el: ElementRef,
    @Optional() private control: NgControl
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^A-Za-z]/g, '').toUpperCase();

    // Limita a 2 caracteres
    if (value.length > 2) {
      value = value.substring(0, 2);
    }

    input.value = value;

    // Atualiza o FormControl
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
