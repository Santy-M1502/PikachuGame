import { Injectable, signal, WritableSignal } from '@angular/core';
import { supabase } from '../../supabase.config';

export interface Usuario {
  id: number;
  auth_id: string;
  nombre: string;
  apellido: string;
  email?: string | null;
}

export interface Message {
  id: number;
  text: string;
  created_at: Date | null;
  user_id: string | null;
  usuario_id: number | null;
  usuario?: Usuario | null;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  messages: WritableSignal<Message[]> = signal<Message[]>([]);

  private channel: any = null;
  private onNewMessageCallbacks: Array<(m: Message) => void> = [];

  constructor() {
    this.fetchMessages();
    this.subscribeToMessages();
  }

  private normalizeRowToMessage(row: any): Message {
    const rawUsuario = row?.usuario;
    let usuario: Usuario | null = null;

    if (Array.isArray(rawUsuario) && rawUsuario.length > 0) {
      const u = rawUsuario[0];
      usuario = {
        id: u.id,
        auth_id: u.auth_id ?? '',
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email ?? null,
      };
    } else if (rawUsuario && !Array.isArray(rawUsuario)) {
      usuario = {
        id: rawUsuario.id,
        auth_id: rawUsuario.auth_id ?? '',
        nombre: rawUsuario.nombre,
        apellido: rawUsuario.apellido,
        email: rawUsuario.email ?? null,
      };
    }

    const createdAtRaw = row.created_at ?? null;
    const createdAt = createdAtRaw ? new Date(createdAtRaw) : null;

    return {
      id: row.id,
      text: row.text,
      created_at: createdAt, 
      user_id: row.user_id ?? null,
      usuario_id: row.usuario_id ?? null,
      usuario,
    };
  }


  async fetchMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select(
        `id, text, created_at, user_id, usuario_id, usuario:usuarios(id, auth_id, nombre, apellido, email)`
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    const rows = (data ?? []) as any[];
    const messages = rows.map((r) => this.normalizeRowToMessage(r));
    this.messages.set(messages);
  }

  async sendMessage(
    text: string,
    user_id: string | null = null,
    usuario_id: number | null = null
  ) {
    if (!text || !text.trim()) return;

    const { data, error } = await supabase
      .from('messages')
      .insert([{ text, user_id, usuario_id }])
      .select(
        `id, text, created_at, user_id, usuario_id, usuario:usuarios(id, auth_id, nombre, apellido, email)`
      );

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    const rows = (data ?? []) as any[];
    if (rows.length > 0) {
      const insertedMessage = this.normalizeRowToMessage(rows[0]);
      this.messages.update((msgs: Message[]) =>
        msgs.some((m) => m.id === insertedMessage.id) ? msgs : [...msgs, insertedMessage]
      );
    }
  }

    subscribeToMessages() {
      if (this.channel) return;

      this.channel = supabase
        .channel('messages-channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          async (payload: any) => {
            try {
              const id = (payload.new as any)['id'];
              if (!id) return;

              const { data, error } = await supabase
                .from('messages')
                .select(
                  `id, text, created_at, user_id, usuario_id, usuario:usuarios(id, auth_id, nombre, apellido, email)`
                )
                .eq('id', id)
                .single();

              if (error) {
                console.error('Error fetching inserted message (realtime):', error);
                return;
              }

              const normalized = this.normalizeRowToMessage(data);

              this.messages.update((msgs) =>
                msgs.some((m) => m.id === normalized.id) ? msgs : [...msgs, normalized]
              );

              this.onNewMessageCallbacks.forEach((cb) => {
                try { cb(normalized); } catch (e) { console.error('onNewMessage callback falló:', e); }
              });
            } catch (e) {
              console.error('Handler INSERT realtime fallo:', e);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages' },
          async (payload: any) => {
            try {
              const id = (payload.new as any)['id'];
              if (!id) return;

              const { data, error } = await supabase
                .from('messages')
                .select(
                  `id, text, created_at, user_id, usuario_id, usuario:usuarios(id, auth_id, nombre, apellido, email)`
                )
                .eq('id', id)
                .single();

              if (error) {
                console.error('Error fetching updated message (realtime):', error);
                return;
              }

              const updated = this.normalizeRowToMessage(data);
              this.messages.update((msgs) => msgs.map((m) => (m.id === updated.id ? updated : m)));
            } catch (e) {
              console.error('Handler UPDATE realtime fallo:', e);
            }
          }
        )
        .subscribe();
    }

  registerOnNewMessage(cb: (m: Message) => void): () => void {
    this.onNewMessageCallbacks.push(cb);
    return () => {
      this.onNewMessageCallbacks = this.onNewMessageCallbacks.filter((c) => c !== cb);
    };
  }
}
