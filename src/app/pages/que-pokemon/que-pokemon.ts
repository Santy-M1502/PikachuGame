import { CommonModule } from '@angular/common';
import { Component, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CanComponentDeactivate } from '../../guards/can-deactivate-guard';
import { HostListener } from '@angular/core';
import { SupabaseService } from '../../services/superbase.service';
import { supabase } from '../../../supabase.config';

@Component({
  selector: 'app-que-pokemon',
  templateUrl: './que-pokemon.html',
  styleUrls: ['./que-pokemon.css'],
  imports: [FormsModule, CommonModule]
})
export class QuePokemon implements OnDestroy, CanComponentDeactivate  {

  mostrarModalSalir = signal(false);
  juegoEnCurso = false;
  private resolveFn: ((value: boolean) => void) | null = null;
  private timer: any;

  pantalla = signal<'inicio' | 'juego' | 'fin'>('inicio');
  puntos = signal(0);
  tiempo = signal(0); // <-- ahora suma tiempo
  pokemonActual = signal<any>(null);
  pokemonSilueta = signal('');
  opciones = signal<string[]>([]);
  resultado = signal('');
  botonesHabilitados = signal(true);

  constructor(private supabaseService: SupabaseService) {}

  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: BeforeUnloadEvent) {
    if (this.juegoEnCurso && this.pantalla() === 'juego') {
      event.preventDefault();
      event.returnValue = 'Si salís, vas a perder el puntaje actual.';
    }
  }

  pokemons = [
    { nombre: 'Bulbasaur', id: 1 },
    { nombre: 'Ivysaur', id: 2 },
    { nombre: 'Venusaur', id: 3 },
    { nombre: 'Charmander', id: 4 },
    { nombre: 'Charmeleon', id: 5 },
    { nombre: 'Charizard', id: 6 },
    { nombre: 'Squirtle', id: 7 },
    { nombre: 'Wartortle', id: 8 },
    { nombre: 'Blastoise', id: 9 },
    { nombre: 'Carterpie', id: 10 },
    { nombre: 'Metapod', id: 11 },
    { nombre: 'Butterfree', id: 12 },
  ];

  ngOnDestroy() {
    clearInterval(this.timer);
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
    clearInterval(this.timer);
    if (this.resolveFn) {
      this.resolveFn(true);
      this.resolveFn = null;
    }
  }

  cancelarSalir() {
    this.mostrarModalSalir.set(false);
    if (this.resolveFn) {
      this.resolveFn(false);
      this.resolveFn = null;
    }
  }

  comenzarJuego() {
    this.juegoEnCurso = true;
    this.puntos.set(0);
    this.tiempo.set(0);
    this.pantalla.set('juego');
    this.nuevoPokemon();
  }

  reiniciarJuego() {
    clearInterval(this.timer);
    this.juegoEnCurso = false;
    this.puntos.set(0);
    this.tiempo.set(0);
    this.pantalla.set('inicio');
  }

  async guardarPuntaje() {
    const { data: userData } = await supabase.auth.getUser();
    const auth_id = userData.user?.id;

    if (!auth_id) {
      console.error('Usuario no logueado');
      return;
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_id', auth_id)
      .single();

    if (!usuario) {
      console.error('Usuario no encontrado en tabla "usuarios"');
      return;
    }

    const puntos = this.puntos();
    const tiempo = this.tiempo();

    try {
      await this.supabaseService.crearPuntaje({
        juego_id: 4, 
        puntos,
        tiempo,
        user_id: usuario.id
      });
      console.log('✅ Puntaje guardado correctamente');
    } catch (error) {
      console.error('Error guardando puntaje:', error);
    }
  }

  nuevoPokemon() {
    const indice = Math.floor(Math.random() * this.pokemons.length);
    const seleccionado = this.pokemons[indice];
    this.pokemonActual.set(seleccionado);

    this.pokemonSilueta.set(`assets/quePokemon/siluetas/${seleccionado.id}-negro.png`);

    this.generarOpciones();
    this.resultado.set('');
    this.botonesHabilitados.set(true);

    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.tiempo.update(t => t + 1);
    }, 1000);
  }


  generarOpciones() {
    const nombres = this.pokemons.map(p => p.nombre);
    let otrasOpciones = nombres.filter(n => n !== this.pokemonActual().nombre);
    otrasOpciones = this.mezclarArray(otrasOpciones).slice(0,3);
    this.opciones.set(this.mezclarArray([this.pokemonActual().nombre, ...otrasOpciones]));
  }

  mezclarArray(array: any[]) {
    return array.map(a => ({sort: Math.random(), value: a}))
                .sort((a,b)=> a.sort-b.sort)
                .map(a => a.value);
  }

  seleccionarOpcion(opcion: string) {
    clearInterval(this.timer);
    this.botonesHabilitados.set(false);

    // mostrar imagen a color
    const seleccionado = this.pokemonActual();
    this.pokemonSilueta.set(`assets/quePokemon/siluetas/${seleccionado.id}-color.png`);

    if(opcion === seleccionado.nombre){
      this.resultado.set('¡Correcto!');
      this.puntos.update(p => p + 10);
      setTimeout(() => this.nuevoPokemon(), 1000);
    } else {
      this.resultado.set(`Incorrecto. Era ${seleccionado.nombre}`);
      this.guardarPuntaje();
      setTimeout(() => this.pantalla.set('fin'), 1000);
    }
  }
}
