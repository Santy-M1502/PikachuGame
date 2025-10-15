import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AuthService, UserData } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  standalone: true,       
  imports: [CommonModule, RouterModule],
  templateUrl: './nav-bar.html',
  styleUrls: ['./nav-bar.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: UserData | null = null;
  isAdmin = false;
  private subscription!: Subscription;

  constructor(public authService: AuthService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
  console.log('NavbarComponent initialized');
  
  this.subscription = this.authService.currentUser$
    .subscribe(user => {

      if (!user) {
        console.log('No user yet, skipping');
        return;
      }

      this.currentUser = user;
      this.isAdmin = user.rol === 'admin';

      this.cdr.detectChanges();
      console.log('detectChanges called');
    });
}



  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
