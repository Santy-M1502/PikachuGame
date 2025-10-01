import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

   async canActivate(): Promise<boolean> {
      try {
        const id = this.auth.getUserId();
        if (!id) {
          this.router.navigate(['/']);
          return false;
        }

        const user = await this.auth.getUser(id);
        if (user?.rol === 'admin') {
          return true;
        }

        this.router.navigate(['/']);
        return false;
      } catch (e) {
        console.error('Error al verificar rol', e);
        this.router.navigate(['/']);
        return false;
      }
    }
}
