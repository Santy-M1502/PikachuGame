import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { AuthGuard } from './guards/auth.guard-guard';
import { NotFound } from './pages/not-found/not-found';
import { Ahorcado } from './pages/ahorcado/ahorcado';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'bienvenida',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'register',
        loadComponent: () => import('./pages/register/register').then(m => m.Register)
    },
    {
        path: 'bienvenida',
        loadComponent: () => import('./pages/bienvenida/bienvenida').then(m => m.Bienvenida)
    },
    {
        path: 'quien-soy',
        loadComponent: () => import('./pages/quien-soy/quien-soy').then(m => m.QuienSoy),
        canActivate: [AuthGuard]
    },
    {
        path: 'juegos',
        loadComponent: () => import('./pages/juegos/juegos').then(m => m.Juegos),
    },
    {
        path: 'juego1',
        loadComponent: () => import('./pages/ahorcado/ahorcado').then(m => m.Ahorcado),
        canActivate: [AuthGuard]
    },
    {
        path: 'juego2',
        loadComponent: () => import('./pages/mayor-omenor/mayor-omenor').then(m => m.MayorOmenor),
        canActivate: [AuthGuard]
    },
    {
        path: '**',
        component: NotFound
    }
];
