import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Project, Carpet } from 'shared-core';

interface ProjectViewModel extends Project {
  carpets: Carpet[];
}

const MOCK_CARPETS: any[] = [
  { id: 'SKU-001', project_fk: 'P-12601', composite_item_name: 'Lobby Main Rug', size: '10x15', quality: 'ht-850', no_of_rugs: 1, designer: 'Alice', yarn_sheet_status: 'Approved', status: 'In Production', is_working: false, time_spent_seconds: 3600, designer_readiness_date: new Date('2026-06-05') },
  { id: 'SKU-002', project_fk: 'P-12601', composite_item_name: 'Lobby Corridor', size: '5x20', quality: 'ht-850', no_of_rugs: 4, designer: 'Alice', yarn_sheet_status: 'Ready', status: 'In Progress', is_working: true, time_spent_seconds: 1800, designer_readiness_date: new Date('2026-06-10') },
  { id: 'SKU-003', project_fk: 'P-12603', composite_item_name: 'Suite Master', size: '20x30', quality: 'ht-650', no_of_rugs: 1, designer: 'Bob', yarn_sheet_status: 'Sourcing', status: 'Need to Assign', is_working: false, time_spent_seconds: 0, designer_readiness_date: null }
];

const MOCK_PROJECTS: ProjectViewModel[] = [
  { 
    id: 'P-12601', client_name: 'Marriott', project_name: 'Lobby Renovation', width: 10, height: 15, carpet_quality: 'ht-850', no_of_rugs: 5, type_of_carpet: 'RUG', timeline_weeks: 6, client_commitment_date: new Date('2026-07-01'), client_expectation: '', skip_artwork: false, sales_order: 'SO-9921', am: 'John Doe', overall_status: 'Active', artwork_approval_deadline: new Date('2026-06-15'),
    carpets: MOCK_CARPETS.filter(c => c.project_fk === 'P-12601')
  },
  { 
    id: 'P-12603', client_name: 'Hyatt', project_name: 'Corridor Upgrade', width: 5, height: 50, carpet_quality: 'ht-750', no_of_rugs: 1, type_of_carpet: 'WALL TO WALL', timeline_weeks: 4, client_commitment_date: new Date('2026-08-01'), client_expectation: '', skip_artwork: false, sales_order: 'SO-9923', am: 'John Doe', overall_status: 'On Hold', artwork_approval_deadline: new Date('2026-07-15'),
    carpets: MOCK_CARPETS.filter(c => c.project_fk === 'P-12603')
  }
];

@Component({
  selector: 'app-am-projects',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatExpansionModule, MatIconModule],
  templateUrl: './am-projects.html',
  styleUrl: './am-projects.css',
})
export class AmProjects {
  projects = MOCK_PROJECTS;
  currentAm = 'John Doe';
  carpetColumns = ['name_sku', 'status', 'readiness_date'];
}
