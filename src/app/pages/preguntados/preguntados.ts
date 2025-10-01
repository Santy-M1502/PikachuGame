import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PokemonService } from '../../services/api.service';
import { SupabaseService } from '../../services/superbase.service';
import { lastValueFrom } from 'rxjs';
import { RespuestaCorrectaIncorrectaDirective } from '../../directive/respuesta-estado';
import { CanComponentDeactivate } from '../../guards/can-deactivate-guard';
import { HostListener } from '@angular/core';

interface Pregunta {
  pregunta: string;
  opciones: string[];
  correcta: string;
}

@Component({
  selector: 'app-preguntados',
  templateUrl: './preguntados.html',
  styleUrls: ['./preguntados.css'],
  imports: [CommonModule, FormsModule, RespuestaCorrectaIncorrectaDirective]
})
export class Preguntados implements OnInit, OnDestroy {

  pantalla = signal<'inicio' | 'juego' | 'fin'>('inicio');
  preguntas = signal<Pregunta[]>([]);
  numeroPregunta = signal(0);
  puntaje = signal(0);
  intentos = signal(3);
  respuestaSeleccionada = signal(false);
  gano = signal(false);
  tiempoTranscurrido = signal(0);
  opcionSeleccionada: string | null = null;

  mostrarModalSalir = signal(false);
  juegoEnCurso = false;
  private resolveFn: ((value: boolean) => void) | null = null;

  private JUEGO_ID = 3;
  private tiempoInicio = 0;
  private timerInterval: any;

  constructor(
    private apiService: PokemonService,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit(): void {}

  ngOnDestroy() {
    clearInterval(this.timerInterval);
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: BeforeUnloadEvent) {
    if (this.juegoEnCurso && this.pantalla() === 'juego') {
      event.preventDefault();
      event.returnValue = 'Si salís, vas a perder el puntaje actual.';
    }
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (this.juegoEnCurso && this.pantalla() === 'juego') {
      this.mostrarModalSalir.set(true);
      return new Promise<boolean>((resolve) => {
        this.resolveFn = resolve;
      });
    }
    return true;
  }

  confirmarSalir() {
    this.mostrarModalSalir.set(false);
    this.pantalla.set('inicio');
    this.juegoEnCurso = false;
    if (this.resolveFn) {
      this.resolveFn(true);
      this.resolveFn = null;
    }
    clearInterval(this.timerInterval);
  }

  cancelarSalir() {
    this.mostrarModalSalir.set(false);
    if (this.resolveFn) {
      this.resolveFn(false);
      this.resolveFn = null;
    }
  }

  async comenzarJuego() {
    this.juegoEnCurso = true;
    this.pantalla.set('juego');
    this.numeroPregunta.set(0);
    this.puntaje.set(0);
    this.intentos.set(3);
    this.respuestaSeleccionada.set(false);
    this.gano.set(false);
    this.tiempoTranscurrido.set(0);

    this.preguntas.set(await this.generarPreguntas(5));

    this.tiempoInicio = Date.now();
    this.timerInterval = setInterval(() => {
      this.tiempoTranscurrido.set(Math.floor((Date.now() - this.tiempoInicio) / 1000));
    }, 1000);
  }

  async generarPreguntas(cantidad: number): Promise<Pregunta[]> {
    const preguntas: Pregunta[] = [];

    const lista: any = await lastValueFrom(this.apiService.getPokemonList(0));
    const allPokemons = lista.results;
    const detallesPromises = allPokemons.map((p: { name: string }) =>
      lastValueFrom(this.apiService.getPokemonDetails(p.name))
    );
    const detallesTodos = await Promise.all(detallesPromises);

    for (let i = 0; i < cantidad; i++) {
      const idx = Math.floor(Math.random() * detallesTodos.length);
      const seleccionado = detallesTodos[idx];
      const atributos = ['tipo', 'movimiento', 'altura', 'peso', 'ability'];
      const atributo = atributos[Math.floor(Math.random() * atributos.length)];

      let preguntaTexto = '';
      let correcta = '';
      const opciones: string[] = [];

      switch (atributo) {
        case 'tipo':
          correcta = seleccionado.types[0].type.name;
          preguntaTexto = `¿Qué tipo de Pokémon es ${seleccionado.name}?`;
          break;
        case 'movimiento':
          const movimientos = seleccionado.moves.map((m: any) => m.move.name);
          correcta = movimientos[Math.floor(Math.random() * movimientos.length)];
          preguntaTexto = `¿Cuál de estos movimientos puede usar ${seleccionado.name}?`;
          break;
        case 'altura':
          correcta = this.formatearMedida(seleccionado.height) + ' m';
          preguntaTexto = `¿Cuál es la altura de ${seleccionado.name}?`;
          break;
        case 'peso':
          correcta = this.formatearMedida(seleccionado.weight) + ' kg';
          preguntaTexto = `¿Cuál es el peso de ${seleccionado.name}?`;
          break;
        case 'ability':
          const abilities = seleccionado.abilities.map((a: any) => a.ability.name);
          correcta = abilities[Math.floor(Math.random() * abilities.length)];
          preguntaTexto = `¿Cuál de estas habilidades tiene ${seleccionado.name}?`;
          break;
      }

      while (opciones.length < 3) {
        const randomIdx = Math.floor(Math.random() * detallesTodos.length);
        const poke = detallesTodos[randomIdx];
        let opcion = '';
        switch (atributo) {
          case 'tipo': opcion = poke.types[0].type.name; break;
          case 'movimiento': 
            const moves = poke.moves.map((m: any) => m.move.name);
            opcion = moves[Math.floor(Math.random() * moves.length)]; break;
          case 'altura': opcion = this.formatearMedida(poke.height) + ' m'; break;
          case 'peso': opcion = this.formatearMedida(poke.weight) + ' kg'; break;
          case 'ability': 
            const abil = poke.abilities.map((a: any) => a.ability.name);
            opcion = abil[Math.floor(Math.random() * abil.length)]; break;
        }
        if (opcion && opcion !== correcta && !opciones.includes(opcion)) opciones.push(opcion);
      }

      opciones.push(correcta);
      opciones.sort(() => Math.random() - 0.5);
      preguntas.push({ pregunta: preguntaTexto, opciones, correcta });
    }

    return preguntas;
  }

  private formatearMedida(valor: number): string {
    const str = valor.toString();
    if (str.length === 1) return `0.${str}`;       // 7 -> 0.7
    if (str.length === 2) return `${str[0]}.${str[1]}`; // 13 -> 1.3
    // si tiene más de 2 dígitos, asumimos que el último dígito es decimal
    return `${str.slice(0, -1)}.${str.slice(-1)}`;
  }

  getEstadoRespuesta(opcion: string): 'correcta' | 'incorrecta' | null {
    if (!this.respuestaSeleccionada()) return null;
    if (opcion === this.preguntaActual.correcta) return 'correcta';
    if (this.opcionSeleccionada === opcion) return 'incorrecta';
    return null;
  }

  get totalPreguntas() { return this.preguntas().length; }
  get preguntaActual(): Pregunta { return this.preguntas()[this.numeroPregunta()]; }

  async responder(opcion: string) {
    this.respuestaSeleccionada.set(true);
    this.opcionSeleccionada = opcion;

    if (opcion === this.preguntaActual.correcta) {
      this.puntaje.set(this.puntaje() + 1);
    } else {
      this.intentos.set(this.intentos() - 1);
    }

    if (this.intentos() <= 0) {
    clearInterval(this.timerInterval);
    }

    setTimeout(async () => {
      const siguiente = this.numeroPregunta() + 1;
      if (siguiente >= this.totalPreguntas || this.intentos() <= 0) {
        this.gano.set(this.intentos() > 0);
        this.pantalla.set('fin');
        clearInterval(this.timerInterval);
        const tiempoFinal = this.tiempoTranscurrido();

        try {
          const { data: userData } = await this.supabaseService.client.auth.getUser();
          const auth_id = userData.user?.id;
          if (!auth_id) throw new Error('Usuario no logueado');

          const { data: usuario } = await this.supabaseService.client
            .from('usuarios')
            .select('id')
            .eq('auth_id', auth_id)
            .single();
          if (!usuario) throw new Error('Usuario no encontrado');

          await this.supabaseService.crearPuntaje({
            juego_id: this.JUEGO_ID,
            puntos: (this.puntaje() + 140 + (this.puntaje() * 3) - tiempoFinal),
            tiempo: tiempoFinal,
            user_id: usuario.id
          });
        } catch (error) {
          console.error('Error guardando puntaje:', error);
        }
      } else {
        this.numeroPregunta.set(siguiente);
        this.respuestaSeleccionada.set(false);
        this.opcionSeleccionada = null;
      }
    }, 1000);
  }

  reiniciarJuego() { this.comenzarJuego(); }
  abrirModalSalir() { this.mostrarModalSalir.set(true); }
}
