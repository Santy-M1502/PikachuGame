import { Component, OnInit, signal, effect } from '@angular/core';
import { SupabaseService, Usuario, Juego, Puntaje } from '../../services/superbase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavBar } from "../../components/nav-bar/nav-bar";

@Component({
  selector: 'app-experiencia',
  templateUrl: './experiencia.html',
  styleUrls: ['./experiencia.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, NavBar]
})
export class Experiencia implements OnInit {
  tipoSeleccionado = signal<string>('');
  puntajes = signal<(Puntaje & { nombre: string; apellido: string })[]>([]);
  juegos = signal<Juego[]>([]);
  juegoSeleccionado = signal<number | null>(null);

  tipos = [
    { value: 'masPuntosGeneral', label: 'Top 10 usuarios con más puntos en general' },
    { value: 'masPuntosJuego', label: 'Top 10 usuarios con más puntos en un juego' },
    { value: 'mejorTiempo', label: 'Top 10 usuarios con menor tiempo en un juego' },
    { value: 'topPuntajes', label: 'Top 10 puntajes de un juego' }
  ];

  constructor(private supabaseService: SupabaseService) {
    effect(() => {
      const tipo = this.tipoSeleccionado();
      const juego = this.juegoSeleccionado();
      if (!tipo) {
        this.puntajes.set([]);
        return;
      }
      this.mostrar(tipo, juego);
    });
  }

  async ngOnInit() {
    const juegosData = await this.supabaseService.getJuegos();
    this.juegos.set(juegosData || []);
  }

  private async mostrar(tipo: string, juego: number | null) {
    switch (tipo) {
      case 'masPuntosGeneral': {
        const data = await this.supabaseService.getUsuariosConMasPuntosJS(10);
        this.puntajes.set(data || []);
        console.log(this.puntajes())
        break;
      }
      case 'masPuntosJuego': {
        if (!juego) return this.puntajes.set([]);
        const data = await this.supabaseService.getUsuariosConMasPuntosPorJuegoJS(juego, 10);
        this.puntajes.set(data || []);
        break;
      }
      case 'mejorTiempo': {
        if (!juego) return this.puntajes.set([]);
        const data = await this.supabaseService.getUsuariosConMejorTiempoJS(juego, 10);
        this.puntajes.set(data || []);
        break;
      }
      case 'topPuntajes': {
        if (!juego) return this.puntajes.set([]);
        const data = await this.supabaseService.getTopPuntajesJS(juego, 10);
        this.puntajes.set(data || []);
        break;
      }
    }
  }
}
