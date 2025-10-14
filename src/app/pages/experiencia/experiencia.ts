import { Component, signal, computed, OnInit } from '@angular/core';
import { SupabaseService, Puntaje, Juego } from '../../services/superbase.service';
import { NavbarComponent } from "../../components/nav-bar/nav-bar";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SearchFilterPipe } from '../../pipes/search-filter-pipe';

type TipoOpcion = { value: string; label: string };

@Component({
  selector: 'app-experiencia',
  templateUrl: './experiencia.html',
  styleUrls: ['./experiencia.css'],
  imports: [NavbarComponent, FormsModule, CommonModule, SearchFilterPipe]
})
export class Experiencia implements OnInit {
  tipoSeleccionado = signal<string>('');
  juegoSeleccionado = signal<number | null>(null);

  tipos: TipoOpcion[] = [
    { value: '', label: '-- Selecciona --' },
    { value: 'masPuntosGeneral', label: 'Más puntos - General' },
    { value: 'masPuntosJuego', label: 'Más puntos - Juego' },
    { value: 'mejorTiempo', label: 'Mejor tiempo' },
    { value: 'topPuntajes', label: 'Top puntajes' },
  ];

  juegos = signal<Juego[]>([]);
  puntajes = signal<Puntaje[]>([]);
  loading = signal(false);

  searchTerm = signal('');
  private debounceId: any = null;

  constructor(private sb: SupabaseService) {}

  ngOnInit(): void {
    this.loadJuegos();
  }

  async loadJuegos() {
    try {
      const data = await this.sb.getJuegos();
      this.juegos.set(data || []);
    } catch (err) {
      console.error('Error cargando juegos', err);
      this.juegos.set([]);
    }
  }

  async onTipoChange(newTipo: string) {
    this.tipoSeleccionado.set(newTipo);
    if (newTipo === 'masPuntosGeneral' || newTipo === '') {
      this.juegoSeleccionado.set(null);
    }
    await this.loadPuntajesPorTipo();
  }

  async onJuegoChange(newJuegoId: number | null) {
    this.juegoSeleccionado.set(newJuegoId);
    await this.loadPuntajesPorTipo();
  }

  async loadPuntajesPorTipo() {
    const tipo = this.tipoSeleccionado();
    const juegoId = this.juegoSeleccionado();
    this.loading.set(true);

    try {
      let data: any[] = [];
      if (!tipo || tipo === '') {
        data = [];
      } else if (tipo === 'masPuntosGeneral') {
        data = await this.sb.getUsuariosConMasPuntosJS(10);
      } else if (tipo === 'masPuntosJuego') {
        if (!juegoId) data = [];
        else data = await this.sb.getUsuariosConMasPuntosPorJuegoJS(juegoId, 10);
      } else if (tipo === 'mejorTiempo') {
        if (!juegoId) data = [];
        else data = await this.sb.getUsuariosConMejorTiempoJS(juegoId, 10);
      } else if (tipo === 'topPuntajes') {
        if (!juegoId) data = [];
        else data = await this.sb.getTopPuntajesJS(juegoId, 10);
      } else {
        data = [];
      }

      this.puntajes.set(data || []);
    } catch (err) {
      console.error('Error cargando puntajes por tipo', err);
      this.puntajes.set([]);
    } finally {
      this.loading.set(false);
    }
  }
  
  async onSearchChange(val: string) {
    this.searchTerm.set(val);
    if (this.debounceId) clearTimeout(this.debounceId);
    this.debounceId = setTimeout(async () => {
      const q = this.searchTerm().trim();
      if (q.length >= 3) {
        this.loading.set(true);
        try {
          const juegoId = this.juegoSeleccionado() ?? undefined;
          const results = await this.sb.searchPuntajesByTerm(q, juegoId);
          this.puntajes.set(results || []);
        } catch (err) {
          console.error('Error en búsqueda server-side', err);
        } finally {
          this.loading.set(false);
        }
      } else {
        await this.loadPuntajesPorTipo();
      }
    }, 300);
  }
}
