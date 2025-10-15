import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChatButton } from '../../components/chat-button/chat-button';
import { finalize } from 'rxjs/operators';   // <-- IMPORTA finalize
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-quien-soy',
  standalone: true,
  imports: [CommonModule, ChatButton, HttpClientModule],
  templateUrl: './quien-soy.html',
  styleUrls: ['./quien-soy.css']
})
export class QuienSoy implements OnInit {
  usuario: any = null;
  username: string = 'Santy-M1502';
  loading = true;
  error = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsuario();
    // o si preferís async: this.loadUsuarioAsync();
  }

  // Opción recomendada: RxJS + finalize
  loadUsuario() {
    this.loading = true;
    this.error = '';
    console.log('[QuienSoy] iniciar carga:', this.username);

    this.http.get(`https://api.github.com/users/${this.username}`)
      .pipe(
        finalize(() => {
          // siempre apaga el loading cuando termine (éxito o error)
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          console.log('[QuienSoy] datos recibidos', data);
          this.usuario = data;
          this.error = '';
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[QuienSoy] error al cargar usuario', err);
          this.usuario = null;
          this.error = 'Error al cargar la información del usuario';
          // loading se apaga en finalize
        }
      });
  }

  // Alternativa: async/await (si preferís)
  async loadUsuarioAsync() {
    this.loading = true;
    this.error = '';
    try {
      const data = await firstValueFrom(this.http.get(`https://api.github.com/users/${this.username}`));
      this.usuario = data;
      this.error = '';
    } catch (err) {
      console.error('[QuienSoy:async] error', err);
      this.usuario = null;
      this.error = 'Error al cargar la información del usuario';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
