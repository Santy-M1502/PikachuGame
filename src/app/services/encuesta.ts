import { Injectable } from '@angular/core';
import { SupabaseService } from './superbase.service';

@Injectable({ providedIn: 'root' })
export class EncuestaService {
  constructor(private supabase: SupabaseService) {}

  async guardarEncuesta(datos: any) {
    const { data, error } = await this.supabase.client
      .from('encuestas')
      .insert([datos]);

    if (error) throw error;
    return data;
  }
}
