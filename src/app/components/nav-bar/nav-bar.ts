import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../services/superbase.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './nav-bar.html',
  styleUrls: ['./nav-bar.css']
})
export class NavBar {

  menuOpen = false;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    public authService: AuthService
  ) {}

  async logout() {
    const { error } = await this.supabaseService.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error.message);
      return;
    }

    localStorage.clear();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
