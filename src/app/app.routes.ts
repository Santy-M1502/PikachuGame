import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Bienvenida } from './pages/bienvenida/bienvenida';
import { QuienSoy } from './pages/quien-soy/quien-soy';
import { AuthGuard } from './guards/auth.guard-guard';
import { NotFound } from './pages/not-found/not-found';
import { Juegos } from './pages/juegos/juegos';
import { MayorOmenor } from './pages/mayor-omenor/mayor-omenor';
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
        component: Register
    },
    {
        path: 'bienvenida',
        component: Bienvenida
    },
    {
        path: 'quien-soy',
        component: QuienSoy,
        canActivate: [AuthGuard]
    },
    {
        path: 'juegos',
        component: Juegos
    },
    {
        path: 'juego1',
        component: Ahorcado,
        canActivate: [AuthGuard]
    },
    {
        path: 'juego2',
        component: MayorOmenor,
        canActivate: [AuthGuard]
    },
    {
        path: '**',
        component: NotFound
    }
];
