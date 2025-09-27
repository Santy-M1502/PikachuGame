import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Juego {
  id: number;
  nombre: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class JuegoService {
  private apiUrl = 'http://localhost:3000/juegos';

  constructor(private http: HttpClient) {}

  getJuego(nombre: string): Observable<Juego[]> {
    return this.http.get<Juego[]>(`${this.apiUrl}?nombre=${nombre}`);
  }

  crearJuego(juego: { nombre: string; descripcion: string }): Observable<Juego> {
    return this.http.post<Juego>(this.apiUrl, juego);
  }
}
