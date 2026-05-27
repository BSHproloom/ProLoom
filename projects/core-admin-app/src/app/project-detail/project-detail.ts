import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ProjectService, UserService, User, Carpet, NotificationService, CarpetService, ActivityLogService } from 'shared-core';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    FormsModule,
    MatFormFieldModule
  ],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css'
})
export class ProjectDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private userService = inject(UserService);
  private notifService = inject(NotificationService);
  private carpetService = inject(CarpetService);
  private activityLogService = inject(ActivityLogService);

  projectId: string = '';
  project: any = null;
  carpets: Carpet[] = [];
  designers: User[] = [];
  logs: any[] = [];

  displayedColumns: string[] = ['sku', 'name', 'size', 'status', 'designer', 'actions'];

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    if (this.projectId) {
      this.loadData();
    }
    
    this.userService.getUsers().subscribe(users => {
      this.designers = users.filter(u => u.role === 'Designer');
    });
  }

  loadData() {
    this.projectService.getProjects().subscribe(projects => {
      this.project = projects.find(p => p.id === this.projectId);
    });

    this.carpetService.getCarpetsForProject(this.projectId).subscribe(carpets => {
      this.carpets = carpets;
    });

    this.activityLogService.getLogsForProject(this.projectId).subscribe(logs => {
      this.logs = logs;
    });
  }

  async assignDesigner(carpet: Carpet, designerName: string) {
    carpet.designer = designerName;
    carpet.status = 'Assigned';
    
    // Find designer email to send notification
    const d = this.designers.find(u => u.name === designerName);
    if (d) {
      await this.notifService.sendNotification({
        recipient_email: d.email,
        message: `You have been assigned to carpet ${carpet.composite_item_name} (${carpet.id}) for project ${this.project?.project_name}`,
        read_status: false,
        timestamp: new Date()
      });
    }

    // Notify AM
    if (this.project?.am) {
      const ams = await new Promise<User[]>(resolve => {
        this.userService.getUsers().subscribe(u => resolve(u));
      });
      const am = ams.find(u => u.name === this.project.am);
      if (am) {
        await this.notifService.sendNotification({
          recipient_email: am.email,
          message: `Carpet ${carpet.composite_item_name} in your project ${this.project.project_name} was assigned to ${designerName}`,
          read_status: false,
          timestamp: new Date()
        });
      }
    }

    alert('Assigned successfully!');
  }
}
