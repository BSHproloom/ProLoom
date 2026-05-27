import { Component, ViewChild, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProjectViewModel, ProjectService } from 'shared-core';

@Component({
  selector: 'app-projects-directory',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
export class ProjectsDirectory implements OnInit, AfterViewInit {
  private projectService = inject(ProjectService);
  
  displayedColumns: string[] = ['id', 'client_name', 'project_name', 'am', 'overall_status', 'aggregatedStatus', 'actions'];
  dataSource = new MatTableDataSource<ProjectViewModel>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatMenuTrigger) contextMenu!: MatMenuTrigger;

  contextMenuPosition = { x: '0px', y: '0px' };

  ngOnInit() {
    this.projectService.getProjects().subscribe(projects => {
      this.dataSource.data = projects;
    });
  }

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
