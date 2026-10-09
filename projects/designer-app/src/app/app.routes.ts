import { Routes } from '@angular/router';
import { MyTasks } from './my-tasks/my-tasks';

export const routes: Routes = [
  { path: 'my-tasks', component: MyTasks },
  { path: 'sample-request', loadComponent: () => import('shared-core').then(m => m.ManualSampleRequestComponent) },
  { path: 'reports', loadComponent: () => import('./reports/reports').then(m => m.Reports) },
  { path: 'leaderboard', loadComponent: () => import('./leaderboard/leaderboard').then(m => m.Leaderboard) },
  { path: 'yarnsheet-calculator', loadComponent: () => import('./yarnsheet-calculator/yarnsheet-calculator').then(m => m.YarnsheetCalculator) },
  { path: 'settings', loadComponent: () => import('./settings/settings').then(m => m.DesignerSettings) },
  { path: 'auth.html', loadComponent: () => import('shared-core').then(m => m.LoginCallbackComponent) },
  { path: '', redirectTo: '/my-tasks', pathMatch: 'full' }
];
