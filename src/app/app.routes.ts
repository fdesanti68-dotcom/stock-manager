import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'investments',
    loadComponent: () => import('./components/investments-list/investments-list.component').then(m => m.InvestmentsListComponent)
  },
  {
    path: 'investment/:id',
    loadComponent: () => import('./components/investment-detail/investment-detail.component').then(m => m.InvestmentDetailComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
