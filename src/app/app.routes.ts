import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { AuthGuard } from './guards/auth.guard-guard';
import { canDeactivateGuard } from './guards/can-deactivate-guard';
import { NotFound } from './pages/not-found/not-found';
import { LoginGuard } from './guards/login-guard';
import { RoleGuard } from './guards/role-guard-guard';
import { AgeGuard } from './guards/age-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'bienvenida', pathMatch: 'full' },
  { 
    path: 'login', 
    component: Login , 
    canActivate: [LoginGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then(m => m.Register),
    canActivate: [LoginGuard]
  },
  {
    path: 'bienvenida',
    loadComponent: () => import('./pages/bienvenida/bienvenida').then(m => m.Bienvenida)
  },
  {
    path: 'quien-soy',
    loadComponent: () => import('./pages/quien-soy/quien-soy').then(m => m.QuienSoy),
    canActivate: [AuthGuard, AgeGuard]
  },
  {
    path: 'juegos',
    loadComponent: () => import('./pages/juegos/juegos').then(m => m.Juegos)
  },
  {
    path: 'juego1',
    loadComponent: () => import('./pages/ahorcado/ahorcado').then(m => m.Ahorcado),
    canActivate: [AuthGuard],
    canDeactivate: [canDeactivateGuard]
  },
  {
    path: 'juego2',
    loadComponent: () => import('./pages/mayor-omenor/mayor-omenor').then(m => m.MayorOmenor),
    canActivate: [AuthGuard],
    canDeactivate: [canDeactivateGuard]
  },
  {
    path: 'juego3',
    loadComponent: () => import('./pages/preguntados/preguntados').then(m => m.Preguntados),
    canActivate: [AuthGuard],
    canDeactivate: [canDeactivateGuard]
  },
  {
    path: 'juego4',
    loadComponent: () => import('./pages/que-pokemon/que-pokemon').then(m => m.QuePokemon),
    canActivate: [AuthGuard],
    canDeactivate: [canDeactivateGuard]
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/experiencia/experiencia').then(m => m.Experiencia),
    canActivate: [AuthGuard],
    canDeactivate: [canDeactivateGuard]
  },
  {
    path: 'chat',
    loadComponent: () => import('./pages/chat/chat').then(m => m.Chat),
    canActivate: [AuthGuard]
  },
  {
    path:'encuesta',
    loadComponent : () => import('./pages/encuesta/encuesta').then(m => m.EncuestaComponent),
    canActivate: [AuthGuard],
    canDeactivate: [canDeactivateGuard]
  },
  {
    path: 'resultado-encuestas',
    loadComponent: () => import('./pages/resultado-encuesta/resultado-encuesta').then(m => m.ResultadoEncuestasComponent),
    canActivate: [AuthGuard, RoleGuard]
  },
  { path: '**', component: NotFound }
];
