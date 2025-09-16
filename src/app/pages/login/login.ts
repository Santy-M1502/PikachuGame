import { Component, signal } from '@angular/core';
import { SupabaseService } from '../../services/superbase.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  email = signal('');
  password = signal('');
  showErrors = signal(false);

  showModal = signal(false);
  modalMessage = signal('');

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email());
  }

  isPasswordValid(): boolean {
    return this.password().length >= 6;
  }

  validateField(field: string) {
    this.showErrors.set(true);
  }

  async login() {
  this.showErrors.set(true);
  if (!this.isEmailValid() || !this.isPasswordValid()) {
    return;
  }
  const { data, error } = await this.supabaseService.signIn(
    this.email(),
    this.password()
  );
  if (error) {
    console.error(error.message);
    this.modalMessage.set('Usuario o contraseña incorrectos. Inténtalo de nuevo.');
    this.showModal.set(true);
  } else {
    localStorage.setItem('token', data.session.access_token);

    localStorage.setItem('user', JSON.stringify(data.user));

    // this.router.navigate(['/bienvenida']);
    window.location.href = '/bienvenida'
  }
}


  closeModal() {
    this.showModal.set(false);
  }

  register() {
    this.router.navigate(['/register']);
  }

  async quickLogin1() {
  this.email.set('prueba@gmail.com');
  this.password.set('prueba');
  await this.login();
  }

  async quickLogin2() {
    this.email.set('prueba2@gmail.com');
    this.password.set('prueba');
    await this.login();
  }

  async quickLogin3() {
    this.email.set('prueba3@gmail.com');
    this.password.set('prueba');
    await this.login();
  }

}
