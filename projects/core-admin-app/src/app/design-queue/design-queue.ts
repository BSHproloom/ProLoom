import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Carpet, CarpetService, UserService, User, ActivityLogService, NotificationService } from 'shared-core';

@Component({
  selector: 'app-design-queue',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCheckboxModule, MatSelectModule, MatButtonModule, MatTabsModule, MatInputModule, FormsModule],
  templateUrl: './design-queue.html',
  styleUrl: './design-queue.css',
})
export class DesignQueue implements OnInit {
  displayedColumns: string[] = ['select', 'id', 'project_fk', 'composite_item_name', 'size'];
  reviewColumns: string[] = ['id', 'project_fk', 'composite_item_name', 'designer', 'time_spent', 'actions'];
  
  dataSource = new MatTableDataSource<Carpet>([]);
  reviewDataSource = new MatTableDataSource<Carpet>([]);
  
  selection = new SelectionModel<Carpet>(true, []);

  private carpetService = inject(CarpetService);
  private userService = inject(UserService);
  private activityLogService = inject(ActivityLogService);
  private notifService = inject(NotificationService);

  designers: User[] = [];
  selectedDesigner = '';

  revisionComment: { [key: string]: string } = {};

  ngOnInit() {
    this.userService.getUsers().subscribe(users => {
      this.designers = users.filter(u => u.role === 'Designer');
    });

    this.carpetService.getAllCarpets().subscribe(carpets => {
      this.dataSource.data = carpets.filter(c => c.status === 'Need to Assign');
      this.reviewDataSource.data = carpets.filter(c => c.status === 'Review Pending');
    });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  async assign() {
    if (this.selection.selected.length === 0 || !this.selectedDesigner) return;
    
    for (const c of this.selection.selected) {
      await this.carpetService.updateCarpet(c.id, {
        designer: this.selectedDesigner,
        status: 'Assigned'
      });

      const d = this.designers.find(x => x.name === this.selectedDesigner);
      if (d) {
        await this.notifService.sendNotification({
          recipient_email: d.email,
          message: `You have been assigned to carpet ${c.composite_item_name} (${c.id})`,
          read_status: false,
          timestamp: new Date()
        });
      }
    }
    
    alert(`Assigned ${this.selection.selected.length} carpets to ${this.selectedDesigner}`);
    this.selection.clear();
  }

  formatTime(totalSeconds: number): string {
    if (!totalSeconds) return '00:00';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

  async approve(carpet: Carpet) {
    await this.carpetService.updateCarpet(carpet.id, { status: 'Sent to AM' });
    
    await this.activityLogService.logActivity({
      carpet_id: carpet.id,
      project_id: carpet.project_fk,
      user_name: 'Admin',
      action: 'Approved',
      comment: 'Artwork approved by Sales Coordinator.',
      timestamp: new Date()
    });

    // We would fetch the project to get the AM, but for now we'll just skip the AM notif if we don't have it directly.
    alert('Artwork approved!');
  }

  async revise(carpet: Carpet) {
    const comment = this.revisionComment[carpet.id] || 'Please revise the artwork.';
    
    await this.carpetService.updateCarpet(carpet.id, { status: 'Revision Needed' });
    
    await this.activityLogService.logActivity({
      carpet_id: carpet.id,
      project_id: carpet.project_fk,
      user_name: 'Admin',
      action: 'Revision Requested',
      comment: comment,
      timestamp: new Date()
    });

    const d = this.designers.find(x => x.name === carpet.designer);
    if (d) {
      await this.notifService.sendNotification({
        recipient_email: d.email,
        message: `Revision requested for ${carpet.composite_item_name} (${carpet.id}): ${comment}`,
        read_status: false,
        timestamp: new Date()
      });
    }

    this.revisionComment[carpet.id] = '';
    alert('Revision sent to designer!');
  }
}
