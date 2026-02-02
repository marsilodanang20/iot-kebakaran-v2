import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./pages/analytics/analytics.page').then(m => m.AnalyticsPage)
      },
      {
        path: 'devices',
        loadComponent: () => import('./pages/devices/devices.page').then(m => m.DevicesPage)
      },
      {
        path: 'alerts',
        loadComponent: () => import('./pages/alerts/alerts.page').then(m => m.AlertsPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'alert-detail/:id',
    loadComponent: () => import('./pages/alert-detail/alert-detail.page').then(m => m.AlertDetailPage)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
