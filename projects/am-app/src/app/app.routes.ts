import { Routes } from '@angular/router';
import { AmProjects } from './am-projects/am-projects';
import { Samples } from './samples/samples';
import { Production } from './production/production';

export const routes: Routes = [
  { path: 'am-projects', component: AmProjects },
  { path: 'production', component: Production },
  {
    path: 'samples',
    loadComponent: () => import('./samples/samples').then(m => m.Samples)
  },
  {
    path: 'assets',
    loadComponent: () => import('./assets/assets').then(m => m.Assets)
  },
  { path: 'auth.html', loadComponent: () => import('shared-core').then(m => m.LoginCallbackComponent) },
  { path: '', redirectTo: '/am-projects', pathMatch: 'full' }
];
