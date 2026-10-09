import { Component, ViewChild, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ProjectViewModel, ProjectService, CarpetService, Carpet, UserService, User, PushService } from 'shared-core';

@Component({
  selector: 'app-projects-directory',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule
  ],
  templateUrl: './projects-directory.html',
  styleUrl: './projects-directory.css',
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ProjectsDirectory implements OnInit, AfterViewInit {
  private projectService = inject(ProjectService);
  private carpetService = inject(CarpetService);
  private userService = inject(UserService);
  private pushService = inject(PushService);
  
  displayedColumns: string[] = ['id', 'client_name', 'project_name', 'am', 'aggregatedStatus', 'actions'];
  columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];
  
  dataSource = new MatTableDataSource<ProjectViewModel>([]);
  expandedElement: ProjectViewModel | null = null;
  projectCarpets: { [projectId: string]: Carpet[] } = {};
  designers: User[] = [];
  allUsers: User[] = [];
  allProjects: ProjectViewModel[] = [];
  amFilter: string = '';

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatMenuTrigger) contextMenu!: MatMenuTrigger;

  contextMenuPosition = { x: '0px', y: '0px' };

  ngOnInit() {
    this.projectService.getProjects().subscribe(projects => {
      this.allProjects = projects;
      this.applyFilters();
    });
    
    // Fetch all carpets upfront to eliminate loading latency
    this.carpetService.getAllCarpets().subscribe(carpets => {
      const grouped: { [projectId: string]: Carpet[] } = {};
      carpets.forEach(carpet => {
        if (!grouped[carpet.project_fk]) {
          grouped[carpet.project_fk] = [];
        }
        grouped[carpet.project_fk].push(carpet);
      });
      this.projectCarpets = grouped;
    });

    this.userService.getUsers().subscribe(users => {
      this.allUsers = users;
      this.designers = users.filter(u => u.role === 'Designer');
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilters() {
    let filtered = this.allProjects;
    if (this.amFilter) {
      filtered = filtered.filter(p => p.am === this.amFilter);
    }
    this.dataSource.data = filtered;
  }

  onAmFilterChange() {
    this.applyFilters();
  }

  toggleRow(element: ProjectViewModel) {
    this.expandedElement = this.expandedElement === element ? null : element;
  }

  async assignDesigner(carpet: Carpet, designerName: string) {
    if (!designerName) return;
    
    // Optimistic UI update for zero latency
    carpet.designer = designerName;
    carpet.status = 'Assigned';

    try {
      await this.carpetService.updateCarpet(carpet.id!, {
        designer: designerName,
        status: 'Assigned',
        assigned_date: new Date()
      });
      
      await this.projectService.updateProject(carpet.project_fk, {
        overall_status: `Artwork assigned to ${designerName}`,
        aggregatedStatus: `Artwork assigned to ${designerName}`
      });
      
      const designerUser = this.designers.find(d => d.name === designerName);
      const project = this.dataSource.data.find(p => p.id === carpet.project_fk);
      const amUser = project ? this.allUsers.find(u => u.name === project.am) : undefined;

      const tokensToNotify: string[] = [];
      if (designerUser && designerUser.fcmTokens) tokensToNotify.push(...designerUser.fcmTokens);
      if (amUser && amUser.fcmTokens) tokensToNotify.push(...amUser.fcmTokens);

      if (tokensToNotify.length > 0) {
        this.pushService.sendPushNotification(
          tokensToNotify,
          'New Artwork Assigned',
          `${designerName} has been assigned to carpet ${carpet.composite_item_name}`
        );
      }
    } catch (e) {
      alert('Error assigning designer');
    }
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

  async deleteProject(project: ProjectViewModel) {
    if (confirm(`Are you sure you want to permanently delete project '${project.project_name}' and ALL its associated carpets?`)) {
      try {
        await this.projectService.deleteProject(project.id);
        // Optional: show a snackbar/toast
      } catch (e) {
        console.error('Error deleting project', e);
        alert('Failed to delete project. Check console for details.');
      }
    }
  }

  getCarpetSummary(projectId: string): string {
    const carpets = this.projectCarpets[projectId];
    if (!carpets || carpets.length === 0) return '0 Carpets';
    
    let done = 0;
    let inProgress = 0;
    
    carpets.forEach(c => {
      const s = c.status;
      if (s === 'Sent to AM' || s === 'Sent to Client' || s === 'Approved' || s === 'Completed') {
        done++;
      } else if (s === 'In Progress' || s === 'Revision Needed' || s === 'Revision Requested') {
        inProgress++;
      }
    });

    const pending = carpets.length - done - inProgress;
    
    return `Total: ${carpets.length} | Done: ${done} | In Progress: ${inProgress} | Pending: ${pending}`;
  }
}
