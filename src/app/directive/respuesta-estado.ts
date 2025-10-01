import { Directive, ElementRef, Input, Renderer2, OnChanges } from '@angular/core';

@Directive({
  selector: '[respuestaEstado]',
  standalone: true
})
export class RespuestaCorrectaIncorrectaDirective implements OnChanges {
  @Input() respuestaEstado: 'correcta' | 'incorrecta' | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges() {
    this.renderer.removeClass(this.el.nativeElement, 'respuesta-correcta');
    this.renderer.removeClass(this.el.nativeElement, 'respuesta-incorrecta');

    if (this.respuestaEstado === 'correcta') {
      this.renderer.addClass(this.el.nativeElement, 'respuesta-correcta');
    } else if (this.respuestaEstado === 'incorrecta') {
      this.renderer.addClass(this.el.nativeElement, 'respuesta-incorrecta');
    }
  }
}
