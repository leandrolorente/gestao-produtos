import { Directive, ElementRef, HostListener, Input, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[numbersOnlyMask]',
  standalone: true
})
export class NumbersOnlyMaskDirective {
  @Input() maxLength?: number;

  constructor(
    private el: ElementRef,
    @Optional() private control: NgControl
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    // Aplica o limite máximo se especificado
    if (this.maxLength && value.length > this.maxLength) {
      value = value.substring(0, this.maxLength);
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
