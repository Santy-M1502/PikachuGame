import { Component, OnInit, signal } from '@angular/core';
import { ChatService, Message } from '../../services/chat.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-button',
  templateUrl: './chat-button.html',
  styleUrls: ['./chat-button.css'],
  imports: [FormsModule, CommonModule]
})
export class ChatButton implements OnInit {
  isOpen = signal(false);
  messages = signal<Message[]>([]);
  newMessage = signal('');

  userId = 1; // tu usuario actual

  constructor(private chatService: ChatService) {}

  async ngOnInit() {
    // Suscribirse a nuevos mensajes
    this.chatService.onNewMessage(msg => {
      this.messages.update(msgs => [...msgs, msg]);
      this.scrollToBottom();
    });
  }

  async toggleChat() {
    this.isOpen.set(!this.isOpen());

    if (this.isOpen()) {
      // Traer mensajes al abrir
      const msgs = await this.chatService.getMessages();
      this.messages.set(msgs);
      this.scrollToBottom();
    }
  }

  async sendMessage() {
    if (!this.newMessage()) return;

    const sent = await this.chatService.sendMessage(this.userId, this.newMessage());
    this.messages.update(msgs => [...msgs, ...sent]);
    this.newMessage.set('');
    this.scrollToBottom();
  }

  scrollToBottom() {
    setTimeout(() => {
      const chatBody = document.querySelector('.chat-body');
      if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
    }, 50);
  }
}
