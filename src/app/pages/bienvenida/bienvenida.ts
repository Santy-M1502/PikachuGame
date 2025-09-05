import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ChatButton } from '../../components/chat-button/chat-button';

@Component({
  selector: 'app-bienvenida',
  imports: [RouterModule, ChatButton],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.css'
})
export class Bienvenida {

}
