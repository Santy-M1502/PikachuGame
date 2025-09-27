import { Component, OnInit, ChangeDetectorRef, signal, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { PokemonService } from '../../services/api.service'; 
import { SupabaseService } from '../../services/superbase.service';
import { supabase } from '../../../supabase.config';
import { CanComponentDeactivate } from '../../guards/can-deactivate-guard';

interface Juego {
  id: number;
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-ahorcado', 
  imports: [CommonModule, FormsModule], 
  templateUrl: './ahorcado.html', 
  styleUrls: ['./ahorcado.css']
})
export class Ahorcado implements OnInit, OnDestroy, CanComponentDeactivate {
  pantalla: 'inicio' | 'juego' | 'fin' = 'inicio';
  adivinados: string[] = [];
  intentos = 6;
  errores = 0;
  palabraSecreta = '';
  pokemons: any[] = [];
  selectedPokemon: any = null;
  gano = false;
  horca = `../../../assets/ahorcado/step1.png`
  loading = false
  juego!: Juego;

  tiempoInicio: number = 0;
  tiempoTranscurrido = signal(0);
  timerInterval: any;

  letras: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  private resolveFn: ((value: boolean) => void) | null = null;

  mostrarModalSalir = false;
  juegoEnCurso = false; // <- bandera para saber si está en partida

  constructor(
    private apiService: PokemonService,
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.pantalla = 'inicio';
    this.initJuego();
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
  }

  // ⚡ Captura cuando cierran la pestaña o recargan
  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: BeforeUnloadEvent) {
    if (this.juegoEnCurso && this.intentos > 0 && this.pantalla === 'juego') {
      event.preventDefault();
      event.returnValue = 'Si salís, vas a perder el puntaje actual.';
    }
  }

  // ⚡ Se usa con el guard de rutas
  canDeactivate(): boolean | Promise<boolean> {
    if (this.juegoEnCurso && this.intentos > 0 && this.pantalla === 'juego') {
      this.mostrarModalSalir = true;

      // devolvemos un Promise y guardamos el resolve
      return new Promise<boolean>((resolve) => {
        this.resolveFn = resolve;
      });
    }
    return true;
  }

  // Inicializamos el juego en la DB
  async initJuego() {
    try {
      let juegos = await this.supabaseService.getJuegoPorNombre('Ahorcado');
      if (juegos.length > 0) {
        this.juego = juegos[0];
      } else {
        this.juego = await this.supabaseService.crearJuego({ 
          nombre: 'Ahorcado', 
          descripcion: 'Adivina el nombre del Pokémon.' 
        });
      }
    } catch (error) {
      console.error('Error inicializando juego:', error);
    }
  }

  comenzarJuego() {
    this.juegoEnCurso = true;
    this.pantalla = 'juego';
    if (!this.palabraSecreta) {
      this.loadPokemons();
    }

    this.tiempoInicio = Date.now();
    this.tiempoTranscurrido.set(0);

    this.timerInterval = setInterval(() => {
      this.tiempoTranscurrido.set(Math.floor((Date.now() - this.tiempoInicio) / 1000));
      this.cdr.detectChanges();
    }, 1000);
  }

  getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  get palabraMostrada(): string {
    return this.palabraSecreta
      .split('')
      .map(l => this.adivinados.includes(l) ? l.toUpperCase() : '_')
      .join(' ');
  }

  loadPokemons() {
    this.loading = true;
    this.apiService.getPokemonList(0).subscribe(response => {
      this.pokemons = response.results;
      const numeroRandom = this.getRandomInt(0, this.pokemons.length);
      this.showPokemonDetails(this.pokemons[numeroRandom]);
    });
  }

  showPokemonDetails(pokemon: any) {
    this.apiService.getPokemonDetails(pokemon.name).subscribe(details => {
      this.selectedPokemon = details;
      this.palabraSecreta = this.limpiarNombrePokemon(pokemon.name.toLowerCase())
      this.adivinados = [];
      this.intentos = 6;
      this.loading = false;
    });
  }

  private limpiarNombrePokemon(nombre: string): string {
    return nombre.replace(/-/g, '');
  }


  adivinar(letra: string) {
    if (this.loading) return;
    letra = letra.toLowerCase();
    if (!this.adivinados.includes(letra) && this.intentos > 0) {
      this.adivinados.push(letra);
      if (!this.palabraSecreta.includes(letra)) {
        this.intentos--;
        this.errores++;
        this.horca = `../../../assets/ahorcado/step${this.errores + 1}.png`
      }
      this.verificarFinJuego();
    }
  }

  verificarFinJuego() {
    const todasAdivinadas = this.palabraSecreta.split('').every(l => this.adivinados.includes(l));

    if (todasAdivinadas) {
      this.gano = true;
      this.pantalla = 'fin';
      this.finalizarJuego();
    } else if (this.intentos <= 0) {
      this.gano = false;
      this.pantalla = 'fin';
      this.finalizarJuego();
    }
  }

  private finalizarJuego() {
    clearInterval(this.timerInterval);
    this.tiempoTranscurrido.set(Math.floor((Date.now() - this.tiempoInicio) / 1000));
    this.juegoEnCurso = false; // ya terminó la partida
    this.guardarPuntaje();
  }

  reiniciarJuego() {
    this.adivinados = [];
    this.intentos = 6;
    this.errores = 0;
    this.palabraSecreta = '';
    this.selectedPokemon = null;
    this.horca = `../../../assets/ahorcado/step1.png`;
    this.gano = false;
    this.pantalla = 'inicio'; 
    this.juegoEnCurso = false;
    this.loadPokemons();
  }

  async guardarPuntaje() {
    if (!this.juego) return;

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

    const largoPalabra = this.palabraSecreta.length;
    const basePorLetra = 5;
    const bonusIntentos = this.intentos * 10;
    const tiempoSegundos = this.tiempoTranscurrido();
    const bonusTiempo = Math.max(0, Math.floor((60 - tiempoSegundos) * 2));
    const puntos = (largoPalabra * basePorLetra) + bonusIntentos + bonusTiempo;

    try {
      await this.supabaseService.crearPuntaje({
        juego_id: this.juego.id,
        puntos,
        tiempo: this.tiempoTranscurrido(),
        user_id: usuario.id 
      });
    } catch (error) {
      console.error('Error guardando puntaje:', error);
    }
  }

  salirDelJuego() {
    this.mostrarModalSalir = true;
  }

  confirmarSalir() {
    this.mostrarModalSalir = false;
    this.reiniciarJuego();
    if (this.resolveFn) {
      this.resolveFn(true);
      this.resolveFn = null;
    }
  }
  cancelarSalir() {
    this.mostrarModalSalir = false;
    if (this.resolveFn) {
      this.resolveFn(false);
      this.resolveFn = null;
    }
  }
}
