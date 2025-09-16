import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/superbase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  imports: [CommonModule, FormsModule],
})
export class Register {
  email = signal('');
  confirmEmail = signal('');
  nombre = signal('');
  apellido = signal('');
  edad = signal<number | null>(null);
  password = signal('');
  confirmPassword = signal('');
  showErrors = signal(false);
  errorMessage = signal('');

  showModal = signal(false);
  modalMessage = signal('');
  showSuccessModal = signal(false);

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  // Validaciones
  isEmailValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isPasswordValid(password: string): boolean {
    return password.length >= 6;
  }

  isNameValid(name: string): boolean {
    return name.trim().length >= 2;
  }

  isAgeValid(age: number | null): boolean {
    return age !== null && age > 0 && age < 120;
  }

  areEqual(a: string, b: string): boolean {
    return a === b;
  }

async register() {
  this.showErrors.set(true);
  this.errorMessage.set('');

  // Campos obligatorios
  if (!this.email() || !this.confirmEmail() || !this.nombre() || !this.apellido() || !this.edad() || !this.password() || !this.confirmPassword()) {
    this.errorMessage.set('Todos los campos son obligatorios');
    return;
  }

  // Validaciones individuales
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

  if (!this.isNameValid(this.nombre())) {
    this.errorMessage.set('El nombre debe tener al menos 2 caracteres');
    return;
  }

  if (!this.isNameValid(this.apellido())) {
    this.errorMessage.set('El apellido debe tener al menos 2 caracteres');
    return;
  }

  if (!this.isAgeValid(this.edad())) {
    this.errorMessage.set('La edad debe ser un número entre 1 y 119');
    return;
  }

  // Registro en Auth
  const { data, error } = await this.supabaseService.signUp(
    this.email(),
    this.password()
  );
  if (error || !data.user) {
    this.errorMessage.set(error?.message ?? 'No se pudo crear el usuario.');
    return;
  }

  const { error: profileError } = await this.supabaseService.insertProfile({
    id: data.user.id,
    nombre: this.nombre(),
    apellido: this.apellido(),
    edad: this.edad()!
  });


  if (profileError) {
    this.errorMessage.set(profileError.message);
  } else {
    this.showSuccessModal.set(true);
  }
}
  goToLogin() {
    this.showSuccessModal.set(false);
    this.router.navigate(['/login']);
  }

  closeModal() {
    this.showModal.set(false);
  }

  
}
