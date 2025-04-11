import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => {
            return import('./home/home.component').then((m) => m.HomeComponent);
        }
    },
    {
        path: 'host',
        loadComponent: () => {
            return import('./host/host.component').then((m) => m.HostComponent);
        }
    },
    {
        path: 'join',
        loadComponent: () => {
            return import('./join/join.component').then((m) => m.JoinComponent);
        }
    },
    {
        path: 'play',
        loadComponent: () => {
            return import('./play/play.component').then((m) => m.PlayComponent);
        }
    },
    {
        path: 'lobby',
        loadComponent: () => {
            return import('./lobby/lobby.component').then((m) => m.LobbyComponent);
        }
    }
];
