import { Component, signal } from '@angular/core';
import { NavigationEnd, RouterModule, RouterOutlet, Router } from '@angular/router';
import { NavBar } from './components/nav-bar/nav-bar';
import { Footer } from './components/footer/footer';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-root',
  imports: [  CommonModule, RouterModule, NavBar, Footer ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  mostrarNavFooter = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const rutasInternas = ['/bienvenida', '/quien-soy'];
        this.mostrarNavFooter = rutasInternas.includes(event.urlAfterRedirects);
      });
  }
}
