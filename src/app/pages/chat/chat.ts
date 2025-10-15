import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { ChatService, Message } from '../../services/chat.service';
import { SupabaseService } from '../../services/superbase.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "../../components/nav-bar/nav-bar";

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [FormsModule, CommonModule, NavbarComponent],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class Chat implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('body', { static: false }) body!: ElementRef<HTMLElement>;

  newMessage = '';
  currentUsuarioId: number | null = null;
  userId: string | null = null;

  private unsubscribeOnNewMessage: (() => void) | null = null;

  constructor(
    public chatService: ChatService,
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadUser();

    await this.chatService.fetchMessages();
    this.cdr.detectChanges();
    setTimeout(() => this.scrollToBottom(), 100);

    this.unsubscribeOnNewMessage = this.chatService.registerOnNewMessage(() => {
      this.cdr.detectChanges();
      this.scrollToBottom();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollToBottom(), 120);
  }

  ngOnDestroy() {
    if (this.unsubscribeOnNewMessage) {
      this.unsubscribeOnNewMessage();
      this.unsubscribeOnNewMessage = null;
    }
  }

  async loadUser() {
    const session = await this.supabaseService.client.auth.getSession();
    this.userId = session.data.session?.user.id ?? null;

    if (this.userId) {
      const { data: usuarioData } = await this.supabaseService.client
        .from('usuarios')
        .select('id')
        .eq('auth_id', this.userId)
        .single();
      this.currentUsuarioId = usuarioData?.id ?? null;
    }
  }

  async send() {
    const text = this.newMessage.trim();
    if (!text) return;

    await this.chatService.sendMessage(text, this.userId, this.currentUsuarioId);
    this.newMessage = '';
    setTimeout(() => this.scrollToBottom(), 80);
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
