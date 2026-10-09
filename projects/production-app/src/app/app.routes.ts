import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { ProductionSamples } from './samples/samples';
import { LoomManagement } from './loom-management/loom-management';
import { UpcomingJobOrders } from './upcoming-job-orders/upcoming-job-orders';

export const routes: Routes = [
  { path: 'dashboard', component: Dashboard },
  { path: 'sample-request', loadComponent: () => import('shared-core').then(m => m.ManualSampleRequestComponent) },
  { path: 'samples', component: ProductionSamples },
  { path: 'loom-management', component: LoomManagement },
  { path: 'upcoming-job-orders', component: UpcomingJobOrders },
  { path: 'auth.html', loadComponent: () => import('shared-core').then(m => m.LoginCallbackComponent) },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
