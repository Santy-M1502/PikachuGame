import { Component, signal } from '@angular/core';
import { NavigationEnd, RouterModule, RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from './components/nav-bar/nav-bar';
import { Footer } from './components/footer/footer';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { SearchFilterPipe } from './pipes/search-filter-pipe';
import { InactivityService } from './services/inactivity-service';


@Component({
  selector: 'app-root',
  imports: [  CommonModule, RouterModule, NavbarComponent ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  mostrarNavFooter = false;

  constructor(private router: Router, private inactivity: InactivityService) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const rutasInternas = ['/bienvenida', '/quien-soy', '/juegos', '/juego1', '/juego2', '/juego3', '/juego4'];
        this.mostrarNavFooter = rutasInternas.includes(event.urlAfterRedirects);
      });
  }
}
