import { Injectable, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PokemonService {

  private apiUrl = 'https://pokeapi.co/api/v2/pokemon/'
  constructor(private http: HttpClient) {}

  getPokemonList(desde: number): Observable<any> {
    return this.http.get(`${this.apiUrl}?limit=100&offset=${desde}`);
  }

  getPokemonDetails(name: string): Observable<any> {
    return this.http.get(`${this.apiUrl}${name}`);
  }
}
