import { CommonModule } from '@angular/common';
import { Component, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-que-pokemon',
  templateUrl: './que-pokemon.html',
  styleUrls: ['./que-pokemon.css'],
  imports: [FormsModule, CommonModule]
})
export class QuePokemon implements OnDestroy {

  pantalla = signal<'inicio' | 'juego' | 'fin'>('inicio');
  puntos = signal(0);
  tiempo = signal(0); // <-- ahora suma tiempo
  pokemonActual = signal<any>(null);
  pokemonSilueta = signal('');
  opciones = signal<string[]>([]);
  resultado = signal('');
  botonesHabilitados = signal(true);

  pokemons = [
    { nombre: 'Pikachu', imagen: 'assets/pokemons/pikachu.png' },
    { nombre: 'Charmander', imagen: 'assets/pokemons/charmander.png' },
    { nombre: 'Bulbasaur', imagen: 'assets/pokemons/bulbasaur.png' },
    { nombre: 'Squirtle', imagen: 'assets/pokemons/squirtle.png' }
  ];

  private timer: any;

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  comenzarJuego() {
    this.puntos.set(0);
    this.tiempo.set(0); // reiniciar tiempo
    this.pantalla.set('juego');
    this.nuevoPokemon();
  }

  reiniciarJuego() {
    clearInterval(this.timer);
    this.puntos.set(0);
    this.tiempo.set(0);
    this.pantalla.set('inicio');
  }


  nuevoPokemon() {
    const indice = Math.floor(Math.random() * this.pokemons.length);
    const seleccionado = this.pokemons[indice];
    this.pokemonActual.set(seleccionado);
    this.pokemonSilueta.set(seleccionado.imagen);

    this.generarOpciones();
    this.resultado.set('');
    this.botonesHabilitados.set(true);

    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.tiempo.update(t => t + 1); // suma 1 segundo cada tick
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
    clearInterval(this.timer); // detener tiempo mientras se muestra resultado
    this.botonesHabilitados.set(false);
    if(opcion === this.pokemonActual().nombre){
      this.resultado.set('¡Correcto!');
      this.puntos.update(p => p + 10);
      setTimeout(() => this.nuevoPokemon(), 1000);
    } else {
      this.resultado.set(`Incorrecto. Era ${this.pokemonActual().nombre}`);
      setTimeout(() => this.pantalla.set('fin'), 1000);
    }
  }
}
