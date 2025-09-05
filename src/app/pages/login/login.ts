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

  // 🔹 estado modal
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

    const { error } = await this.supabaseService.signIn(this.email(), this.password());
    if (error) {
      console.error(error.message);
      this.modalMessage.set('Usuario o contraseña incorrectos. Inténtalo de nuevo.');
      this.showModal.set(true);
    } else {
      this.router.navigate(['/bienvenida']);
    }
  }

  closeModal() {
    this.showModal.set(false);
  }

  register() {
    this.router.navigate(['/register']);
  }

  fillQuickLogin1() {
    this.email.set('santy15021502tw@gmail.com');
    this.password.set('123456');
  }

  fillQuickLogin2() {
    this.email.set('santy150215022@gmail.com');
    this.password.set('123456');
  }

  fillQuickLogin3() {
    this.email.set('santy150215024@gmail.com');
    this.password.set('ABCDEF');
  }
}
