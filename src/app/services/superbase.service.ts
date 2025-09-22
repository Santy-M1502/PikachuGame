import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../supabase.config';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabase.supabaseUrl, supabase.supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  private async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  async insertProfile(profile: { id: string; nombre: string; apellido: string; edad: number }) {
    try {
      const tableExists = await this.checkTableExists('profiles');
      if (!tableExists) {
        throw new Error('La tabla de perfiles no existe en la base de datos. Por favor, contacte al administrador.');
      }

      const session = await this.supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('No hay sesión activa');
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .insert([profile])
        .select();

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
