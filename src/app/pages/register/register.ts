import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/superbase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  imports: [CommonModule],
})
export class Register {
  email = signal('');
  confirmEmail = signal('');
  password = signal('');
  confirmPassword = signal('');
  showErrors = signal(false);
  errorMessage = signal('');

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  // mismas validaciones que en login
  isEmailValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isPasswordValid(password: string): boolean {
    return password.length >= 6;
  }

  areEqual(a: string, b: string): boolean {
    return a === b;
  }

  async register() {
    this.showErrors.set(true);
    this.errorMessage.set('');

    // validaciones
    if (!this.email() || !this.confirmEmail() || !this.password() || !this.confirmPassword()) {
      this.errorMessage.set('Todos los campos son obligatorios');
      return;
    }

    if (!this.isEmailValid(this.email())) {
      this.errorMessage.set('El email no es válido');
      return;
    }

    if (!this.areEqual(this.email(), this.confirmEmail())) {
      this.errorMessage.set('Los emails no coinciden');
      return;
    }

    if (!this.isPasswordValid(this.password())) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!this.areEqual(this.password(), this.confirmPassword())) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    // registro
    const { error } = await this.supabaseService.signUp(this.email(), this.password());
    if (error) {
      this.errorMessage.set(error.message);
    } else {
      this.router.navigate(['/login']);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
