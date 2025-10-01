import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { supabase } from '../../../supabase.config';

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

  constructor(private router: Router) {}

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: this.email(),
      password: this.password(),
    });

    if (error) {
      console.error(error.message);
      this.modalMessage.set('Usuario o contraseña incorrectos. Inténtalo de nuevo.');
      this.showModal.set(true);
      return;
    }

    if (!data?.user || !data?.session) {
      this.modalMessage.set('Error iniciando sesión. Intenta más tarde.');
      this.showModal.set(true);
      return;
    }

    localStorage.setItem('token', data.session.access_token);

    const authUserId = data.user.id;
    const { data: userDb, error: userError } = await supabase
      .from('usuarios')
      .select('id, rol')
      .eq('auth_id', authUserId)
      .single();

    if (userError || !userDb) {
      console.error('Error buscando usuario en DB:', userError?.message);
      this.modalMessage.set('No se encontró el usuario en la base de datos.');
      this.showModal.set(true);
      return;
    }

    localStorage.setItem('user_id', userDb.id);
    localStorage.setItem('user_rol', userDb.rol);

    window.location.href = '/bienvenida';
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
