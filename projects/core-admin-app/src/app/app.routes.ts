import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { ProjectsDirectory } from './projects-directory/projects-directory';
import { NewProjectForm } from './new-project-form/new-project-form';
import { DesignQueue } from './design-queue/design-queue';
import { Settings } from './settings/settings';
import { ProjectDetail } from './project-detail/project-detail';

export const routes: Routes = [
  { path: 'dashboard', component: Dashboard },
  { path: 'projects', component: ProjectsDirectory },
  { path: 'project/:id', component: ProjectDetail },
  { path: 'new-project', component: NewProjectForm },
  { path: 'design-queue', component: DesignQueue },
  { path: 'settings', component: Settings },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
