import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-juegos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './juegos.html',
  styleUrls: ['./juegos.css']
})
export class Juegos {
  showMessage = signal(false);

  constructor(private router: Router, private authService: AuthService) {}

  goToJuego(ruta: string) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([ruta]);
    } else {
      this.showMessage.set(true);
      setTimeout(() => this.showMessage.set(false), 2500);
    }
  }
}
