import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { ProjectsDirectory } from './projects-directory/projects-directory';
import { NewProjectForm } from './new-project-form/new-project-form';
import { DesignQueue } from './design-queue/design-queue';

export const routes: Routes = [
  { path: 'dashboard', component: Dashboard },
  { path: 'projects', component: ProjectsDirectory },
  { path: 'new-project', component: NewProjectForm },
  { path: 'design-queue', component: DesignQueue },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];
