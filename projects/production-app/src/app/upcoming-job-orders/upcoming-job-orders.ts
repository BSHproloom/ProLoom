import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { CarpetService, ProjectService, Carpet, Project } from 'shared-core';

interface ProjectJobOrder {
  project_id: string;
  project_name: string;
  client: string;
  status: string;
  total_sqm: number;
  carpets: Carpet[];
  expanded?: boolean;
}

@Component({
  selector: 'app-upcoming-job-orders',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule],
  templateUrl: './upcoming-job-orders.html'
})
export class UpcomingJobOrders implements OnInit {
  private carpetService = inject(CarpetService);
  private projectService = inject(ProjectService);

  jobOrders: ProjectJobOrder[] = [];
  isLoading = true;

  ngOnInit() {
    this.projectService.getProjects().subscribe(projects => {
      this.carpetService.getAllCarpets().subscribe(carpets => {
        
        const projectMap = new Map<string, ProjectJobOrder>();

        for (const p of projects) {
          projectMap.set(p.id, {
            project_id: p.id,
            project_name: p.project_name,
            client: p.client_name,
            status: (p as any).overall_status || 'Unknown',
            total_sqm: 0,
            carpets: [],
            expanded: false
          });
        }

        for (const c of carpets) {
          if (projectMap.has(c.project_fk)) {
            const pj = projectMap.get(c.project_fk)!;
            pj.carpets.push(c);
            pj.total_sqm += (c.area || 0) * (c.no_of_rugs || 1);
          }
        }

        // Only show projects that have not been delivered
        this.jobOrders = Array.from(projectMap.values())
          .filter(p => p.status !== 'Delivered' && p.carpets.length > 0)
          .sort((a,b) => b.total_sqm - a.total_sqm);
          
        this.isLoading = false;
      });
    });
  }

  toggleExpand(order: ProjectJobOrder) {
    order.expanded = !order.expanded;
  }
}
