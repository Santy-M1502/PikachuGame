import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ChatButton } from '../../components/chat-button/chat-button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-bienvenida',
  imports: [RouterModule, ChatButton],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.css'
})
export class Bienvenida {
  constructor(private router: Router, public authService : AuthService) {}

  openChat() {
    this.router.navigate(['/chat']);
  }
}
