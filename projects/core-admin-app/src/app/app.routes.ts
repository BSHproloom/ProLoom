import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { ProjectsDirectory } from './projects-directory/projects-directory';
import { NewProjectForm } from './new-project-form/new-project-form';
import { DesignQueue } from './design-queue/design-queue';
import { Settings } from './settings/settings';
import { ProjectDetail } from './project-detail/project-detail';
import { Reports } from './reports/reports';
import { Samples } from './samples/samples';

import { YarnOrders } from './yarn-orders/yarn-orders';

import { CeoDashboard } from './ceo-dashboard/ceo-dashboard';

import { ToDoList } from './to-do-list/to-do-list';

export const routes: Routes = [
  { path: 'ceo-dashboard', component: CeoDashboard },
  { path: 'dashboard', component: Dashboard },
  { path: 'projects', component: ProjectsDirectory },
  { path: 'project/:id', component: ProjectDetail },
  { path: 'new-project', component: NewProjectForm },
  { path: 'design-queue', component: DesignQueue },
  { path: 'samples', component: Samples },
  { path: 'sample-request', loadComponent: () => import('shared-core').then(m => m.ManualSampleRequestComponent) },
  { path: 'yarn-orders', component: YarnOrders },
  { path: 'reports', component: Reports },
  { path: 'to-do-list', component: ToDoList },
  { path: 'settings', component: Settings },
  { path: 'auth.html', loadComponent: () => import('shared-core').then(m => m.LoginCallbackComponent) },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
