import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { ProjectService, Project } from 'shared-core';

interface PendingTask {
  projectId: string;
  projectName: string;
  client: string;
  missingInfo: string[];
}

@Component({
  selector: 'app-to-do-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './to-do-list.html',
  styleUrl: './to-do-list.css'
})
export class ToDoList implements OnInit {
  projectService = inject(ProjectService);
  pendingTasks: PendingTask[] = [];
  displayedColumns: string[] = ['client', 'projectName', 'missingInfo', 'action'];

  ngOnInit() {
    this.projectService.getProjects().subscribe(projects => {
      const tasks: PendingTask[] = [];
      projects.forEach(p => {
        const missing = [];
        if (!p.sales_order || p.sales_order === 'Pending') missing.push('Sales Order Number');
        if (!p.client_expectation_date) missing.push('Client Expectation Date');
        if (!p.timeline_weeks) missing.push('Timeline (Weeks)');
        
        if (missing.length > 0 && p.overall_status !== 'Completed') {
          tasks.push({
            projectId: p.id,
            projectName: p.project_name,
            client: p.client_name,
            missingInfo: missing
          });
        }
      });
      this.pendingTasks = tasks;
    });
  }
}
