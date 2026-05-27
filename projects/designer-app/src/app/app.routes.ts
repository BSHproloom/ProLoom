import { Routes } from '@angular/router';
import { MyTasks } from './my-tasks/my-tasks';

export const routes: Routes = [
  { path: 'my-tasks', component: MyTasks },
  { path: '', redirectTo: '/my-tasks', pathMatch: 'full' }
];
