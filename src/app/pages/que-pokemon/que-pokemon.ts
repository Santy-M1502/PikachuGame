import { CommonModule } from '@angular/common';
import { Component, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/superbase.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-que-pokemon',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './que-pokemon.html',
  styleUrls: ['./que-pokemon.css']
})
export class QuePokemon {

  // UI
  pantalla = signal<'inicio'|'juego'|'fin'>('inicio');
  textoObjetivo = signal('');
  textoTipeado = signal('');
  tiempo = signal(0);

  // Estadísticas
  errores = signal(0);
  precision = signal(0);
  wpm = signal(0);
  puntos = signal(0);

  botonesHabilitados = signal(true);
  juegoEnCurso = false;
  PENALTY_PER_ERROR = 1;
  resultado = signal<{ wpm:number; accuracy:number; puntos:number } | null>(null);

  // Timer
  private timerSub: Subscription | null = null;

  frases = [
    'Pikachu es electrico',
    'Charizard vuela alto',
    'Bulbasaur planta y veneno',
    'Squirtle lanza agua',
    'Eevee evoluciona con amistad',
    'Mewtwo es muy poderoso'
  ];

  constructor(private supabaseService: SupabaseService) {}

  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: BeforeUnloadEvent) {
    if (this.pantalla() === 'juego') {
      event.preventDefault();
      event.returnValue = 'Si salís, vas a perder el puntaje actual.';
    }
  }

  comenzarJuego() {
    this.reset();
    this.textoObjetivo.set(this.frases[Math.floor(Math.random() * this.frases.length)]);
    this.pantalla.set('juego');
    this.timerSub = interval(1000).subscribe(() => this.tiempo.update(t => t + 1));
  }

  onInput(value: string) {
    this.textoTipeado.set(value);

    const objetivo = this.textoObjetivo();
    const tipeado = value;

    let correctas = 0;
    let errores = 0;

    for (let i = 0; i < objetivo.length; i++) {
      const c = tipeado[i];
      if (c == null) continue;
      if (c === objetivo[i]) correctas++;
      else errores++;
    }

    this.errores.set(errores);
    const precision = Math.round((correctas / objetivo.length) * 100);
    this.precision.set(precision);

    const segundos = Math.max(1, this.tiempo());
    const wpm = Math.round(((tipeado.length / 5) / (segundos / 60)));
    this.wpm.set(wpm);

    const puntos = Math.round(wpm * (precision / 100));
    this.puntos.set(puntos);

    // Si terminó la frase
    if (tipeado.length >= objetivo.length) this.terminarRonda();
  }

  private terminarRonda() {
    this.botonesHabilitados.set(false);
    this.limpiarTimer();

    const objetivoLen = this.textoObjetivo().length;
    const tipeado = this.textoTipeado();
    const segundos = Math.max(1, this.tiempo());

    // correctos reales
    let correctos = 0;
    for (let i = 0; i < Math.min(tipeado.length, objetivoLen); i++) {
      if (tipeado[i] === this.textoObjetivo()[i]) correctos++;
    }

    // errores reales
    const erroresAct = Math.max(0, tipeado.length - correctos);

    // precisión penalizada
    const penalizedCorrects = Math.max(0, correctos - (erroresAct * this.PENALTY_PER_ERROR));
    const accuracyRatio = penalizedCorrects / Math.max(1, objetivoLen);
    const accuracy = Math.round(accuracyRatio * 1000) / 10; // porcentaje con 1 decimal

    // WPM
    const wpm = Math.round(((tipeado.length / 5) / (segundos / 60)) * 10) / 10;

    // puntos
    const puntosFinal = Math.max(0, Math.round(wpm * accuracyRatio * 10 / 3));
    this.puntos.set(puntosFinal);

    this.resultado.set({ wpm, accuracy, puntos: puntosFinal });
    this.pantalla.set('fin');
    this.juegoEnCurso = false;

    this.saveScore(puntosFinal).catch(console.error);
  }

  private async saveScore(puntosFinal: number) {

        const { data: userData } = await this.supabaseService.client.auth.getUser();
        const auth_id = userData.user?.id;
    
        if (!auth_id) {
          console.error('Usuario no logueado');
          return;
        }
    
        const { data: usuario } = await this.supabaseService.client
          .from('usuarios')
          .select('id')
          .eq('auth_id', auth_id)
          .single();
    
        if (!usuario) {
          console.error('Usuario no encontrado en tabla "usuarios"');
          return;
        }

    try {
      const res = await this.supabaseService.crearPuntaje({
        juego_id: 2,
        puntos: this.puntos(),
        tiempo: this.tiempo(),
        user_id: usuario.id
      });
      console.log('Puntaje guardado:', res);
    } catch (error) {
      console.error('Error guardando puntaje:', error);
    }
  }

  private limpiarTimer() {
    if (this.timerSub) { this.timerSub.unsubscribe(); this.timerSub = null; }
  }

  private reset() {
    this.textoTipeado.set('');
    this.tiempo.set(0);
    this.errores.set(0);
    this.precision.set(0);
    this.wpm.set(0);
    this.puntos.set(0);
    this.limpiarTimer();
  }

  private async guardarPuntaje() {
    try {
      const { data: userData } = await this.supabaseService.client.auth.getUser();
      const auth_id = userData?.user?.id;
      if (!auth_id) throw new Error('No logueado');

      const { data: usuario } = await this.supabaseService.client
        .from('usuarios')
        .select('id')
        .eq('auth_id', auth_id)
        .single();

      await this.supabaseService.crearPuntaje({
        juego_id: 4,
        puntos: this.puntos(),
        tiempo: this.tiempo(),
        user_id: usuario?.id
      });

      console.log('✅ Puntaje guardado:', this.puntos());
    } catch (e) {
      console.error('❌ Error al guardar puntaje:', e);
    }
  }
}
