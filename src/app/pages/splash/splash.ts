import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-splash',
  imports: [],
  templateUrl: './splash.html',
  styleUrls: ['./splash.css']
})
export class Splash{
  constructor(private router: Router) {}

  ngOnInit() {

    setTimeout(() => {
        this.router.navigateByUrl('/login', { replaceUrl: true });
    }, 4500);
  }
}
