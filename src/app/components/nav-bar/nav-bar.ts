import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../services/superbase.service';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav-bar.html',
  styleUrls: ['./nav-bar.css']
})
export class NavBar {
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async logout() {
    const { error } = await this.supabaseService.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error.message);
      return;
    }

    localStorage.clear();
    this.router.navigate(['/login']);
  }

}
