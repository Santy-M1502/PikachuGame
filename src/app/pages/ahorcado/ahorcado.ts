import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { PokemonService } from '../../services/api.service'; 

@Component(
  { selector: 'app-ahorcado', 
    imports: [CommonModule, FormsModule], 
    templateUrl: './ahorcado.html', 
    styleUrls: ['./ahorcado.css']
  })

export class Ahorcado implements OnInit {
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

  letras: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  constructor(private apiService: PokemonService) {}

  ngOnInit() {
    this.pantalla = 'inicio';
    this.loadPokemons();
  }

  comenzarJuego() {
    this.pantalla = 'juego';
      if(!this.palabraSecreta){
        this.loadPokemons()
      }
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
    this.apiService.getPokemonList().subscribe(response => {
      this.pokemons = response.results;
      const numeroRandom = this.getRandomInt(0, this.pokemons.length);
      this.showPokemonDetails(this.pokemons[numeroRandom]);
    });
  }

  showPokemonDetails(pokemon: any) {
      this.apiService.getPokemonDetails(pokemon.name).subscribe(details => {
      this.selectedPokemon = details;
      this.palabraSecreta = pokemon.name.toLowerCase();
      this.adivinados = [];
      this.intentos = 6;
      this.loading = false
    });
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
    }
    if (this.intentos <= 0) {
      this.gano = false;
      this.pantalla = 'fin';
    }
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
    this.loadPokemons();
  }
}
