import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChatButton } from '../../components/chat-button/chat-button';

@Component({
  selector: 'app-quien-soy',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ChatButton],
  templateUrl: './quien-soy.html',
  styleUrls: ['./quien-soy.css']
})
export class QuienSoy implements OnInit {
  usuario: any = null;
  username: string = 'Santy-M1502';
  loading = true;
  error = '';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadUsuario();
  }

  loadUsuario() {
    this.loading = true;
    this.error = '';
    this.http.get(`https://api.github.com/users/${this.username}`)
      .subscribe({
        next: (data) => {
          this.usuario = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar usuario', err);
          this.error = 'Error al cargar la información del usuario';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }
}
