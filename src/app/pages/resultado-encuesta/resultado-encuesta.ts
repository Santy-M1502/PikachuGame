import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/superbase.service';
import { AuthService } from '../../services/auth.service';
import { RouterModule, Router } from '@angular/router';
import { NavbarComponent } from "../../components/nav-bar/nav-bar";

@Component({
  selector: 'app-resultado-encuestas',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './resultado-encuesta.html',
  styleUrls: ['./resultado-encuesta.css']
})
export class ResultadoEncuestasComponent implements OnInit {
  encuestas: any[] = [];
  loading = true;

  page = 0;
  pageSize = 10;
  displayedEncuestas: any[] = [];

  promedio1 = 0;
  promedio2 = 0;
  promedio3 = 0;

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/bienvenida']);
      return;
    }

    await this.cargarEncuestas();
    this.cdr.detectChanges()
  }

  async cargarEncuestas() {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      const { data, error } = await this.supabase.getEncuestas();
      if (error) throw error;

      this.encuestas = data ?? [];
      this.calcularPromedios();
      this.actualizarPagina();

      this.cdr.detectChanges();
    } catch (err) {
      console.error('Error cargando encuestas:', err);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  actualizarPagina() {
    const start = this.page * this.pageSize;
    const end = start + this.pageSize;
    this.displayedEncuestas = this.encuestas.slice(start, end);
  }

  siguientePagina() {
    if ((this.page + 1) * this.pageSize < this.encuestas.length) {
      this.page++;
      this.actualizarPagina();
    }
  }

  calcularPromedios() {
    const total = this.encuestas.length;
    if (total === 0) return;
    this.promedio1 = this.encuestas.reduce((acc, e) => acc + e.pregunta1, 0) / total;
    this.promedio2 = this.encuestas.reduce((acc, e) => acc + e.pregunta2, 0) / total;
    this.promedio3 = this.encuestas.reduce((acc, e) => acc + e.pregunta3, 0) / total;
  }
}
