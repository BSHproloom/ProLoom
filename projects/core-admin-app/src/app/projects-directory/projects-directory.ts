import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Project } from 'shared-core';

export interface ProjectViewModel extends Project {
  aggregatedStatus: string;
}

const MOCK_PROJECTS: ProjectViewModel[] = [
  {
    id: 'P-12601',
    client_name: 'Marriott',
    project_name: 'Lobby Renovation',
    width: 10,
    height: 15,
    carpet_quality: 'ht-850',
    no_of_rugs: 5,
    type_of_carpet: 'RUG',
    timeline_weeks: 6,
    client_commitment_date: new Date('2026-07-01'),
    client_expectation: 'High end luxury feel',
    skip_artwork: false,
    sales_order: 'SO-9921',
    am: 'John Doe',
    overall_status: 'Active',
    artwork_approval_deadline: new Date('2026-06-15'),
    aggregatedStatus: 'Artwork Approved: 2/5, In Revision: 1'
  },
  {
    id: 'P-12602',
    client_name: 'Hilton',
    project_name: 'Suite Carpets',
    width: 20,
    height: 30,
    carpet_quality: 'ht-650',
    no_of_rugs: 1,
    type_of_carpet: 'WALL TO WALL',
    timeline_weeks: 4,
    client_commitment_date: new Date('2026-06-20'),
    client_expectation: 'Durable',
    skip_artwork: true,
    sales_order: 'SO-9922',
    am: 'Jane Smith',
    overall_status: 'On Hold',
    artwork_approval_deadline: new Date('2026-05-30'),
    aggregatedStatus: 'Artwork Pending: 1/1'
  }
];

@Component({
  selector: 'app-projects-directory',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './projects-directory.html',
  styleUrl: './projects-directory.css',
})
export class ProjectsDirectory implements AfterViewInit {
  displayedColumns: string[] = ['id', 'client_name', 'project_name', 'am', 'overall_status', 'aggregatedStatus', 'actions'];
  dataSource = new MatTableDataSource<ProjectViewModel>(MOCK_PROJECTS);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatMenuTrigger) contextMenu!: MatMenuTrigger;

  contextMenuPosition = { x: '0px', y: '0px' };

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onContextMenu(event: MouseEvent, project: ProjectViewModel) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { 'project': project };
    this.contextMenu.menu?.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  copyToWhatsApp(project: ProjectViewModel) {
    const text = `Project: ${project.project_name} (${project.id})\nClient: ${project.client_name}\nStatus: ${project.aggregatedStatus}`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Data copied to clipboard for WhatsApp!');
    });
  }
}
