import { Routes } from '@angular/router';
import { AmProjects } from './am-projects/am-projects';
import { Samples } from './samples/samples';
import { Production } from './production/production';

export const routes: Routes = [
  { path: 'am-projects', component: AmProjects },
  { path: 'production', component: Production },
  { path: 'samples', component: Samples },
  { path: '', redirectTo: '/am-projects', pathMatch: 'full' }
];
