// src/app/pages/ranking/ranking.component.ts
import { Component, signal, computed, OnInit } from '@angular/core';
import { SupabaseService, Puntaje, Juego } from '../../services/superbase.service';
import { NavBar } from "../../components/nav-bar/nav-bar";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SearchFilterPipe } from '../../pipes/search-filter-pipe';

type TipoOpcion = { value: string; label: string };

@Component({
  selector: 'app-experiencia',
  templateUrl: './experiencia.html',
  styleUrls: ['./experiencia.css'],
  imports: [NavBar, FormsModule, CommonModule, SearchFilterPipe]
})
export class Experiencia implements OnInit {
  // señales que tu template espera (tipoSeleccionado(), juegoSeleccionado(), puntajes())
  tipoSeleccionado = signal<string>('');
  juegoSeleccionado = signal<number | null>(null);

  // listado de tipos (ejemplo)
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

  // búsqueda/filtrado cliente
  searchTerm = signal('');
  private debounceId: any = null;

  constructor(private sb: SupabaseService) {}

  ngOnInit(): void {
    this.loadJuegos();
    // efecto: cuando cambia tipo o juego, recargar
    // (si no querés efectos, podés llamar manualmente desde template a una función)
    // Aquí usamos un pequeño efecto con setTimeout para no spamear peticiones
    // (podés quitar esto si preferís control manual)
    // inicializamos cargando puntajes vacíos o default
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

  // llamado cuando se cambia el tipo en el select (tu template hace tipoSeleccionado.set)
  async onTipoChange(newTipo: string) {
    this.tipoSeleccionado.set(newTipo);
    // reset juego si aplica
    if (newTipo === 'masPuntosGeneral' || newTipo === '') {
      this.juegoSeleccionado.set(null);
    }
    await this.loadPuntajesPorTipo();
  }

  async onJuegoChange(newJuegoId: number | null) {
    this.juegoSeleccionado.set(newJuegoId);
    await this.loadPuntajesPorTipo();
  }

  // carga según tipo seleccionado - usa tus RPCs donde corresponde
  async loadPuntajesPorTipo() {
    const tipo = this.tipoSeleccionado();
    const juegoId = this.juegoSeleccionado();
    this.loading.set(true);

    try {
      let data: any[] = [];
      if (!tipo || tipo === '') {
        data = [];
      } else if (tipo === 'masPuntosGeneral') {
        data = await this.sb.getUsuariosConMasPuntosJS(50); // por ejemplo 50
      } else if (tipo === 'masPuntosJuego') {
        if (!juegoId) data = [];
        else data = await this.sb.getUsuariosConMasPuntosPorJuegoJS(juegoId, 50);
      } else if (tipo === 'mejorTiempo') {
        if (!juegoId) data = [];
        else data = await this.sb.getUsuariosConMejorTiempoJS(juegoId, 50);
      } else if (tipo === 'topPuntajes') {
        if (!juegoId) data = [];
        else data = await this.sb.getTopPuntajesJS(juegoId, 50);
      } else {
        data = [];
      }

      // Si los RPCs devuelven objetos con forma distinta a Puntaje, mapealos aquí.
      this.puntajes.set(data || []);
    } catch (err) {
      console.error('Error cargando puntajes por tipo', err);
      this.puntajes.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  // búsqueda principal: si el término tiene >= 3 chars, hacemos búsqueda server-side por usuarios -> puntajes
  async onSearchChange(val: string) {
    this.searchTerm.set(val);
    // debounce simple
    if (this.debounceId) clearTimeout(this.debounceId);
    this.debounceId = setTimeout(async () => {
      const q = this.searchTerm().trim();
      if (q.length >= 3) {
        // búsqueda server-side
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
        // si term < 3, recargamos por tipo normal
        await this.loadPuntajesPorTipo();
      }
    }, 300);
  }
}
