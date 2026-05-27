import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Project, Carpet, ProjectService, UserService } from 'shared-core';

interface ProjectViewModel extends Project {
  carpets: Carpet[];
}

const MOCK_CARPETS: any[] = [
  { id: 'SKU-001', project_fk: 'P-12601', composite_item_name: 'Lobby Main Rug', size: '10x15', quality: 'ht-850', no_of_rugs: 1, designer: 'Alice', yarn_sheet_status: 'Approved', status: 'In Production', is_working: false, time_spent_seconds: 3600, designer_readiness_date: new Date('2026-06-05') },
  { id: 'SKU-002', project_fk: 'P-12601', composite_item_name: 'Lobby Corridor', size: '5x20', quality: 'ht-850', no_of_rugs: 4, designer: 'Alice', yarn_sheet_status: 'Ready', status: 'In Progress', is_working: true, time_spent_seconds: 1800, designer_readiness_date: new Date('2026-06-10') },
  { id: 'SKU-003', project_fk: 'P-12603', composite_item_name: 'Suite Master', size: '20x30', quality: 'ht-650', no_of_rugs: 1, designer: 'Bob', yarn_sheet_status: 'Sourcing', status: 'Need to Assign', is_working: false, time_spent_seconds: 0, designer_readiness_date: null }
];

@Component({
  selector: 'app-am-projects',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatExpansionModule, MatIconModule, FormsModule],
  templateUrl: './am-projects.html',
  styleUrl: './am-projects.css',
})
export class AmProjects {
  
  allProjects: any[] = [];
  projects: any[] = [];
  
  ams: string[] = ['Unassigned'];
  currentAm = 'Unassigned';
  
  carpetColumns = ['name_sku', 'status', 'readiness_date'];

  constructor(private ps: ProjectService, private userService: UserService) {
    this.userService.getUsers().subscribe(users => {
      this.ams = users.filter(u => u.role === 'AM').map(u => u.name);
      if (!this.ams.includes('Unassigned')) {
        this.ams.push('Unassigned');
      }
      
      // Auto-select the first real AM if currently 'Unassigned' and real AMs exist
      if (this.currentAm === 'Unassigned' && this.ams.length > 1) {
        this.currentAm = this.ams[0];
      }
      this.filterProjects();
    });

    this.ps.getProjects().subscribe(projects => {
      this.allProjects = projects.map(p => ({
        ...p,
        carpets: MOCK_CARPETS.filter(c => c.project_fk === p.id)
      }));
      this.filterProjects();
    });
  }

  filterProjects() {
    this.projects = this.allProjects.filter(p => p.am === this.currentAm);
  }
}
