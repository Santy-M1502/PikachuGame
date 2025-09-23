// src/app/services/chat.service.ts
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
  created_at: string | null;
  user_id: string | null;
  usuario_id: number | null;
  usuario?: Usuario | null;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  messages: WritableSignal<Message[]> = signal<Message[]>([]);

  constructor() {
    this.fetchMessages();
  }

  private normalizeRowToMessage(row: any): Message {
    // Supabase devuelve `usuario` como array (relación). Tomamos el primer elemento si existe.
    const rawUsuario = row?.usuario;
    let usuario: Usuario | null = null;

    if (Array.isArray(rawUsuario) && rawUsuario.length > 0) {
      const u = rawUsuario[0];
      usuario = {
        id: u.id,
        auth_id: u.auth_id ?? '', // si no viene, dejamos string vacío (o null si preferís cambiar el tipo)
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email ?? null,
      };
    } else if (rawUsuario && !Array.isArray(rawUsuario)) {
      // por si la respuesta viene ya como objeto (precaución)
      usuario = {
        id: rawUsuario.id,
        auth_id: rawUsuario.auth_id ?? '',
        nombre: rawUsuario.nombre,
        apellido: rawUsuario.apellido,
        email: rawUsuario.email ?? null,
      };
    }

    return {
      id: row.id,
      text: row.text,
      created_at: row.created_at ?? null,
      user_id: row.user_id ?? null,
      usuario_id: row.usuario_id ?? null,
      usuario,
    };
  }

  // Traer mensajes con usuario relacionado (pedimos auth_id también)
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

  // Enviar un mensaje
  async sendMessage(text: string, user_id: string | null = null, usuario_id: number | null = null) {
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
      this.messages.update((msgs: Message[]) => [...msgs, insertedMessage]);
    }
  }
}
