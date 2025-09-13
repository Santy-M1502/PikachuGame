import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Bienvenida } from './pages/bienvenida/bienvenida';
import { QuienSoy } from './pages/quien-soy/quien-soy';
import { AuthGuard } from './guards/auth.guard-guard';
import { NotFound } from './pages/not-found/not-found';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
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
        component: Bienvenida,
        canActivate: [AuthGuard]
    },
    {
        path: 'quien-soy',
        component: QuienSoy,
        canActivate: [AuthGuard]
    },
    {
        path: '**',
        component: NotFound
    }
];
