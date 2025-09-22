import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../supabase.config';

export interface Message {
  id: number;
  user_id: number;
  nombre: string;
  apellido: string;
  text: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabase.supabaseUrl, supabase.supabaseKey);
  }

  async getMessages(): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('id, user_id, text, created_at, usuarios(nombre, apellido)')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(d => ({
      id: (d as any)['id'],
      user_id: (d as any)['user_id'],
      text: (d as any)['text'],
      created_at: (d as any)['created_at'],
      nombre: ((d as any)['usuarios']?.[0]?.nombre) || 'Desconocido',
      apellido: ((d as any)['usuarios']?.[0]?.apellido) || ''
    }));
  }

  async sendMessage(userId: number, text: string) {
    const { data, error } = await this.supabase
      .from('messages')
      .insert([{ user_id: userId, text }]);

    if (error) throw error;

    return (data || []).map(d => ({
      id: (d as any)['id'],
      user_id: (d as any)['user_id'],
      text: (d as any)['text'],
      created_at: (d as any)['created_at'],
      nombre: 'TuNombre',
      apellido: 'TuApellido'
    }));
  }

  onNewMessage(callback: (msg: Message) => void) {
    this.supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          const p = payload.new as any;
          callback({
            id: p['id'],
            user_id: p['user_id'],
            text: p['text'],
            created_at: p['created_at'],
            nombre: p['usuarios']?.[0]?.nombre || 'Desconocido',
            apellido: p['usuarios']?.[0]?.apellido || ''
          });
        }
      )
      .subscribe();
  }
}
