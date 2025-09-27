import { Component, OnInit, signal, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/superbase.service';
import { supabase } from '../../../supabase.config';

@Component({
  selector: 'app-mayor-omenor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mayor-omenor.html',
  styleUrls: ['./mayor-omenor.css']
})
export class MayorOmenor implements OnInit {
  cartas = [
    { rayo: { as:{valor:1, nombre:'As', imagen:'assets/cartasNaipes/Amarillo1.png'},
              dos:{valor:2, nombre:'Dos', imagen:'assets/cartasNaipes/Amarillo2.png'},
              tres:{valor:3, nombre:'Tres', imagen:'assets/cartasNaipes/Amarillo3.png'},
              cuatro:{valor:4, nombre:'Cuatro', imagen:'assets/cartasNaipes/Amarillo4.png'},
              cinco:{valor:5, nombre:'Cinco', imagen:'assets/cartasNaipes/Amarillo5.png'},
              seis:{valor:6, nombre:'Seis', imagen:'assets/cartasNaipes/Amarillo6.png'},
              siete:{valor:7, nombre:'Siete', imagen:'assets/cartasNaipes/Amarillo7.png'},
              ocho:{valor:8, nombre:'Ocho', imagen:'assets/cartasNaipes/Amarillo8.png'},
              nueve:{valor:9, nombre:'Nueve', imagen:'assets/cartasNaipes/Amarillo9.png'},
              diez:{valor:10, nombre:'Diez', imagen:'assets/cartasNaipes/Amarillo10.png'},
              j:{valor:11, nombre:'J', imagen:'assets/cartasNaipes/AmarilloJ.png'},
              q:{valor:12, nombre:'Q', imagen:'assets/cartasNaipes/AmarilloQ.png'},
              k:{valor:13, nombre:'K', imagen:'assets/cartasNaipes/AmarilloK.png'} } },
    { planta: { as:{valor:1, nombre:'As', imagen:'assets/cartasNaipes/Verde1.png'},
                dos:{valor:2, nombre:'Dos', imagen:'assets/cartasNaipes/Verde2.png'},
                tres:{valor:3, nombre:'Tres', imagen:'assets/cartasNaipes/Verde3.png'},
                cuatro:{valor:4, nombre:'Cuatro', imagen:'assets/cartasNaipes/Verde4.png'},
                cinco:{valor:5, nombre:'Cinco', imagen:'assets/cartasNaipes/Verde5.png'},
                seis:{valor:6, nombre:'Seis', imagen:'assets/cartasNaipes/Verde6.png'},
                siete:{valor:7, nombre:'Siete', imagen:'assets/cartasNaipes/Verde7.png'},
                ocho:{valor:8, nombre:'Ocho', imagen:'assets/cartasNaipes/Verde8.png'},
                nueve:{valor:9, nombre:'Nueve', imagen:'assets/cartasNaipes/Verde9.png'},
                diez:{valor:10, nombre:'Diez', imagen:'assets/cartasNaipes/Verde10.png'},
                j:{valor:11, nombre:'J', imagen:'assets/cartasNaipes/VerdeJ.png'},
                q:{valor:12, nombre:'Q', imagen:'assets/cartasNaipes/VerdeQ.png'},
                k:{valor:13, nombre:'K', imagen:'assets/cartasNaipes/VerdeK.png'} } },
    { agua: { as:{valor:1, nombre:'As', imagen:'assets/cartasNaipes/Azul1.png'},
              dos:{valor:2, nombre:'Dos', imagen:'assets/cartasNaipes/Azul2.png'},
              tres:{valor:3, nombre:'Tres', imagen:'assets/cartasNaipes/Azul3.png'},
              cuatro:{valor:4, nombre:'Cuatro', imagen:'assets/cartasNaipes/Azul4.png'},
              cinco:{valor:5, nombre:'Cinco', imagen:'assets/cartasNaipes/Azul5.png'},
              seis:{valor:6, nombre:'Seis', imagen:'assets/cartasNaipes/Azul6.png'},
              siete:{valor:7, nombre:'Siete', imagen:'assets/cartasNaipes/Azul7.png'},
              ocho:{valor:8, nombre:'Ocho', imagen:'assets/cartasNaipes/Azul8.png'},
              nueve:{valor:9, nombre:'Nueve', imagen:'assets/cartasNaipes/Azul9.png'},
              diez:{valor:10, nombre:'Diez', imagen:'assets/cartasNaipes/Azul10.png'},
              j:{valor:11, nombre:'J', imagen:'assets/cartasNaipes/AzulJ.png'},
              q:{valor:12, nombre:'Q', imagen:'assets/cartasNaipes/AzulQ.png'},
              k:{valor:13, nombre:'K', imagen:'assets/cartasNaipes/AzulK.png'} } },
    { fuego: { as:{valor:1, nombre:'As', imagen:'assets/cartasNaipes/Rojo1.png'},
               dos:{valor:2, nombre:'Dos', imagen:'assets/cartasNaipes/Rojo2.png'},
               tres:{valor:3, nombre:'Tres', imagen:'assets/cartasNaipes/Rojo3.png'},
               cuatro:{valor:4, nombre:'Cuatro', imagen:'assets/cartasNaipes/Rojo4.png'},
               cinco:{valor:5, nombre:'Cinco', imagen:'assets/cartasNaipes/Rojo5.png'},
               seis:{valor:6, nombre:'Seis', imagen:'assets/cartasNaipes/Rojo6.png'},
               siete:{valor:7, nombre:'Siete', imagen:'assets/cartasNaipes/Rojo7.png'},
               ocho:{valor:8, nombre:'Ocho', imagen:'assets/cartasNaipes/Rojo8.png'},
               nueve:{valor:9, nombre:'Nueve', imagen:'assets/cartasNaipes/Rojo9.png'},
               diez:{valor:10, nombre:'Diez', imagen:'assets/cartasNaipes/Rojo10.png'},
               j:{valor:11, nombre:'J', imagen:'assets/cartasNaipes/RojoJ.png'},
               q:{valor:12, nombre:'Q', imagen:'assets/cartasNaipes/RojoQ.png'},
               k:{valor:13, nombre:'K', imagen:'assets/cartasNaipes/RojoK.png'} } }
  ];

  cartaAleatoria: any;
  resultado = signal('');
  puntos = signal(0);
  pantalla: 'inicio' | 'juego' | 'fin' = 'inicio';
  cartasUsadas: any[] = [];
  tiempoInicio = 0;
  tiempoTranscurrido = signal(0);
  timerInterval: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object,
              private supabaseService: SupabaseService) {}

  getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  getCartaAleatoria(): any {
    let intentos = 0;
    let carta: any;
    do {
      const paloIndex = this.getRandomInt(0, this.cartas.length);
      const paloObj = this.cartas[paloIndex];
      const nombrePalo = Object.keys(paloObj)[0];
      const cartasDelPalo = (paloObj as any)[nombrePalo];
      const claves = Object.keys(cartasDelPalo);
      carta = cartasDelPalo[claves[this.getRandomInt(0, claves.length)]];
      intentos++;
      if (intentos > 100) break;
    } while (this.cartasUsadas.includes(carta));

    this.cartasUsadas.push(carta);
    return carta;
  }

  comenzarJuego() {
    this.puntos.set(0);
    this.resultado.set('');
    this.cartasUsadas = [];
    this.cartaAleatoria = this.getCartaAleatoria();
    this.tiempoInicio = Date.now();
    this.tiempoTranscurrido.set(0);

    this.timerInterval = setInterval(() => {
      this.tiempoTranscurrido.set(Math.floor((Date.now() - this.tiempoInicio) / 1000));
    }, 1000);

    this.pantalla = 'juego';
  }

  compararCartas(eleccion: 'mayor' | 'menor') {
    let puntosSumar = 1; // base por acertar

    // Bonus por cartas extremas
    if ((eleccion === 'menor' && [1,2,3].includes(this.cartaAleatoria.valor)) ||
        (eleccion === 'mayor' && [11,12,13].includes(this.cartaAleatoria.valor))) {
      puntosSumar += 5;
    }

    const nuevaCarta = this.getCartaAleatoria();

    if ((eleccion === 'mayor' && nuevaCarta.valor >= this.cartaAleatoria.valor) ||
        (eleccion === 'menor' && nuevaCarta.valor <= this.cartaAleatoria.valor)) {
      this.resultado.set('Correcto!');
      this.puntos.set(this.puntos() + puntosSumar);
      this.cartaAleatoria = nuevaCarta;
    } else {
      this.resultado.set('Incorrecto!');
      this.finalizarJuego();
    }

    if (this.cartasUsadas.length === 52) {
      this.cartasUsadas = [];
      this.resultado.set('¡Has usado todas las cartas! Reiniciando mazo.');
    }
  }

  finalizarJuego() {
    clearInterval(this.timerInterval);
    this.tiempoTranscurrido.set(Math.floor((Date.now() - this.tiempoInicio) / 1000));
    this.pantalla = 'fin';
    this.guardarPuntaje();
  }

  async guardarPuntaje() {
    const { data: userData } = await supabase.auth.getUser();
    const auth_id = userData.user?.id;

    if (!auth_id) {
      console.error('Usuario no logueado');
      return;
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_id', auth_id)
      .single();

    if (!usuario) {
      console.error('Usuario no encontrado en tabla "usuarios"');
      return;
    }

    // Solo se guarda el puntaje basado en cartas correctas + bonus
    const puntosFinales = this.puntos() + 135;

    try {
      const res = await this.supabaseService.crearPuntaje({
        juego_id: 2,
        puntos: puntosFinales,
        tiempo: this.tiempoTranscurrido(), // se guarda pero no afecta puntos
        user_id: usuario.id
      });
      console.log('Puntaje guardado:', res);
    } catch (error) {
      console.error('Error guardando puntaje:', error);
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
      this.cartaAleatoria = this.getCartaAleatoria();
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
      clearInterval(this.timerInterval);
    }
  }
}