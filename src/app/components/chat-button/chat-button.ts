import { Component, signal, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { ChatService, Message } from '../../services/chat.service';
import { SupabaseService } from '../../services/superbase.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-button',
  templateUrl: './chat-button.html',
  styleUrls: ['./chat-button.css'],
  imports: [FormsModule, CommonModule]
})
export class ChatButton implements AfterViewInit {
  @ViewChild('body', { static: false }) body!: ElementRef<HTMLElement>;

  newMessageSignal = signal('');
  open = false;
  currentUsuarioId: number | null = null;
  userId = signal<string | null>(null);

  constructor(public chatService: ChatService, private supabaseService: SupabaseService) {
    this.loadUser();

    effect(() => {
      this.chatService.messages(); 
      if (this.open) setTimeout(() => this.scrollToBottom(), 60);
    });
  }

  get newMessage() {
    return this.newMessageSignal();
  }
  set newMessage(value: string) {
    this.newMessageSignal.set(value);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollToBottom(), 60);
  }

  async loadUser() {
    const session = await this.supabaseService.client.auth.getSession();
    const userId = session.data.session?.user.id ?? null;
    this.userId.set(userId);

    if (userId) {
      const { data: usuarioData } = await this.supabaseService.client
        .from('usuarios')
        .select('id')
        .eq('auth_id', userId)
        .single();
      this.currentUsuarioId = usuarioData?.id ?? null;
    }
  }

  toggle() { 
    this.open = !this.open; 
    if (this.open) setTimeout(() => this.scrollToBottom(), 80); 
  }

  async send() {
    const text = this.newMessage.trim();
    if (!text) return;

    const session = await this.supabaseService.client.auth.getSession();
    const userId = session.data.session?.user.id ?? null;

    const { data: usuarioData } = await this.supabaseService.client
      .from('usuarios')
      .select('id')
      .eq('auth_id', userId)
      .single();

    const usuarioId = usuarioData?.id ?? null;

    await this.chatService.sendMessage(text, userId, usuarioId);

    this.newMessage = '';
    setTimeout(() => this.scrollToBottom(), 80);
  }

  close() { 
    this.open = false; 
  }

  private scrollToBottom() {
    try {
      const el = this.body?.nativeElement;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch (e) {
      console.error('Error al scrollear:', e);
    }
  }

  getMessages(): Message[] {
    return this.chatService.messages();
  }

}
