import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Puntaje {
  id: number;
  juego_id: number;
  puntos: number;
  tiempo?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class PuntajeService {
  private apiUrl = 'http://localhost:3000/puntajes';

  constructor(private http: HttpClient) {}

  crearPuntaje(puntaje: { juego_id: number; puntos: number; tiempo?: number | null }): Observable<Puntaje> {
    return this.http.post<Puntaje>(this.apiUrl, puntaje);
  }
}
