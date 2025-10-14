import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PokemonService {

  private apiUrl = 'https://pokeapi.co/api/v2/pokemon/';
  
  constructor(private http: HttpClient) {}

  getPokemonList(desde: number, hasta: number): Observable<any> {
    const limit = hasta - desde + 1;
    return this.http.get(`${this.apiUrl}?limit=${limit}&offset=${desde}`);
  }

  getPokemonDetails(name: string): Observable<any> {
    return this.http.get(`${this.apiUrl}${name}`);
  }
}
