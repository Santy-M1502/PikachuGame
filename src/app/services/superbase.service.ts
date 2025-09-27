import { Injectable } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../supabase.config';

export interface Usuario {
  id: number;
  auth_id: string;
  nombre: string;
  apellido: string;
  email?: string;
  edad?: number;
  created_at?: string;
}

export interface Juego {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface Puntaje {
  id: number;
  juego_id: number;
  user_id: number;
  puntos: number;
  tiempo?: string;
  usuarios?: Usuario;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabase;
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  private async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  async insertProfile(profile: { auth_id: string; nombre: string; apellido: string; edad: number; email: string }) {
    try {
      const tableExists = await this.checkTableExists('usuarios');
      if (!tableExists) {
        throw new Error('La tabla "usuarios" no existe en la base de datos.');
      }

      const { data, error } = await this.supabase
        .from('usuarios')
        .insert([{
          auth_id: profile.auth_id,
          nombre: profile.nombre,
          apellido: profile.apellido,
          email: profile.email,
          edad: profile.edad
        }])
        .select('id, auth_id, nombre, apellido, email');

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  get client() {
    return this.supabase;
  }

  async crearPuntaje(data: { juego_id: number; puntos: number; tiempo: number; user_id: number }) {
    const { error, data: res } = await supabase
      .from('puntajes')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return res;
  }

  async getJuegos() {
    const { data, error } = await this.supabase
      .from('juegos')
      .select('*');
    if (error) throw error;
    return data || [];
  }

  async getJuegoPorNombre(nombre: string) {
    const { data, error } = await supabase
      .from('juegos')
      .select('*')
      .eq('nombre', nombre);
    if (error) throw error;
    return data;
  }

  async crearJuego(data: { nombre: string; descripcion: string }) {
    const { data: res, error } = await supabase
      .from('juegos')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return res;
  }

  // 1. Top 10 usuarios con más puntos en general
  async getUsuariosConMasPuntosJS(limit: number = 10) {
    const { data, error } = await this.supabase.rpc('get_usuarios_con_mas_puntos', { limit_param: limit });

    if (error) throw error;
    return data;
  }

  // 2. Top 10 usuarios con más puntos en un juego específico
  async getUsuariosConMasPuntosPorJuegoJS(juego_id: number, limit: number = 10) {
    const { data, error } = await this.supabase.rpc(
      'get_usuarios_con_mas_puntos_por_juego',
      { juego_id_param: juego_id, limit_param: limit }
    );

    if (error) throw error;
    return data;
  }

  // 3. Top 10 usuarios con menor tiempo en un juego
  async getUsuariosConMejorTiempoJS(juego_id: number, limit: number = 10) {
    const { data, error } = await this.supabase.rpc(
      'get_usuarios_con_mejor_tiempo',
      { juego_id_param: juego_id, limit_param: limit }
    );

    if (error) throw error;
    return data;
  }

  // 4. Top 10 puntajes de un juego
  async getTopPuntajesJS(juego_id: number, top: number = 10) {
    const { data, error } = await this.supabase.rpc(
      'get_top_puntajes_por_juego',
      { juego_id_param: juego_id, limit_param: top }
    );

    if (error) throw error;
    return data;
  }
}
