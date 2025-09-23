import { Injectable } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../supabase.config';

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
        throw new Error('La tabla "usuarios" no existe en la base de datos. Por favor, contacte al administrador.');
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

      if (error) {
        console.error('Error inserting profile:', error);
        throw error;
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Error in insertProfile:', err);
      return { data: null, error: err };
    }
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  get client() {
    return this.supabase;
  }
}
