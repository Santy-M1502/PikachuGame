import { Component, signal, ViewChild, ElementRef, AfterViewInit, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ChatService, Message } from '../../services/chat.service';
import { SupabaseService } from '../../services/superbase.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-button',
  templateUrl: './chat-button.html',
  styleUrls: ['./chat-button.css'],
  imports: [FormsModule, CommonModule],
  standalone: true,
})
export class ChatButton implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('body', { static: false }) body!: ElementRef<HTMLElement>;

  newMessageSignal = signal('');
  open = false;
  currentUsuarioId: number | null = null;
  userId = signal<string | null>(null);

  // ahora guardamos la función para desregistrar el callback
  private unsubscribeOnNewMessage: (() => void) | null = null;

  constructor(
    public chatService: ChatService,
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  get newMessage() {
    return this.newMessageSignal();
  }
  set newMessage(value: string) {
    this.newMessageSignal.set(value);
  }

  async ngOnInit() {
    // cargar usuario
    await this.loadUser();

    // traer los mensajes iniciales
    await this.chatService.fetchMessages();
    this.cdr.detectChanges();

    // registrarnos solo para notificaciones de "nuevo mensaje" (para scrollear y forzar detectChanges)
    this.unsubscribeOnNewMessage = this.chatService.registerOnNewMessage((nuevo: Message) => {
      // el ChatService ya actualizó la lista (dedupe incluida).
      this.cdr.detectChanges();
      if (this.open) this.scrollToBottom();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollToBottom(), 60);
  }

  ngOnDestroy() {
    if (this.unsubscribeOnNewMessage) {
      this.unsubscribeOnNewMessage();
      this.unsubscribeOnNewMessage = null;
    }
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

    await this.chatService.sendMessage(text, this.userId(), this.currentUsuarioId);
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
