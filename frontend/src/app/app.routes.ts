import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./components/home').then(m => m.HomeComponent) },
  { path: 'auth', loadComponent: () => import('./components/auth').then(m => m.AuthComponent) },
  { path: 'booking', loadComponent: () => import('./components/booking').then(m => m.BookingComponent) },
  { path: 'admin', loadComponent: () => import('./components/admin').then(m => m.AdminComponent) },
  { path: '**', redirectTo: 'home' }
];
