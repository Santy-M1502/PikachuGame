import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../supabase.config';

// src/app/services/supabase.service.ts
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

  // Login
  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  // Registro
  signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password});
  }

  // Logout
  signOut() {
    return this.supabase.auth.signOut();
  }

  // Obtener cliente
  get client() {
    return this.supabase;
  }
}