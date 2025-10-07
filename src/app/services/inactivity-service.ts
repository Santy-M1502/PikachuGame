// inactivity.service.ts
import { Injectable, Inject, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class InactivityService {
  private timeout: any;
  private readonly INACTIVITY_TIME = 5 * 60 * 1000;
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.initListener();
      this.resetTimer();
    }
  }

  private initListener() {
    if (!this.isBrowser) return;
    window.addEventListener('mousemove', () => this.resetTimer());
    window.addEventListener('keydown', () => this.resetTimer());
  }

  private resetTimer() {
    if (!this.isBrowser) return;
    clearTimeout(this.timeout);
    this.ngZone.runOutsideAngular(() => {
      this.timeout = setTimeout(() => this.logout(), this.INACTIVITY_TIME);
    });
  }

  private logout() {
    if (!this.isBrowser) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_rol'); 
    this.router.navigate(['/login']);
  }
}
