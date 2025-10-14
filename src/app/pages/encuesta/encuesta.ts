import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/superbase.service';
import { NavbarComponent } from "../../components/nav-bar/nav-bar";

@Component({
  selector: 'app-encuesta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NavbarComponent],
  templateUrl: './encuesta.html',
  styleUrls: ['encuesta.css']
})
export class EncuestaComponent implements OnInit {
  encuestaForm: any;
  submitted = false;

  constructor(private fb: FormBuilder, private supabase: SupabaseService) {}

  ngOnInit() {
    this.encuestaForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(18), Validators.max(99)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{1,10}$/)]],
      pregunta1: [3, Validators.required],
      pregunta2: ['', Validators.required],
      pregunta3: ['', Validators.required],
    });
  }

  async enviarEncuesta() {
    this.submitted = true;
    if (this.encuestaForm.invalid) return;

    const { nombre, apellido, edad, telefono, pregunta1, pregunta2, pregunta3 } = this.encuestaForm.value;

    try {
      const { error } = await this.supabase.client.from('encuestas').insert([
        { nombre, apellido, edad, telefono, pregunta1, pregunta2, pregunta3 },
      ]);

      if (error) throw error;

      alert('✅ Encuesta enviada con éxito.');
      this.encuestaForm.reset();
      this.submitted = false;
    } catch (err) {
      console.error('Error al guardar encuesta:', err);
      alert('❌ Error al enviar la encuesta.');
    }
  }
}
