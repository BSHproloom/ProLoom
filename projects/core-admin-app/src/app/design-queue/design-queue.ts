import { Component, OnInit, inject, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { Carpet, CarpetService, UserService, User, ActivityLogService, NotificationService } from 'shared-core';

@Component({
  selector: 'app-design-queue',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCheckboxModule, MatSelectModule, MatButtonModule, MatTabsModule, MatInputModule, FormsModule, MatDialogModule, MatDatepickerModule, MatNativeDateModule, MatCardModule, MatIconModule, MatMenuModule],
  templateUrl: './design-queue.html',
  styleUrl: './design-queue.css',
})
export class DesignQueue implements OnInit {
  displayedColumns: string[] = ['select', 'id', 'project_fk', 'composite_item_name', 'size'];
  reviewColumns: string[] = ['id', 'project_fk', 'composite_item_name', 'designer', 'time_spent', 'actions'];
  
  dataSource = new MatTableDataSource<Carpet>([]);
  reviewDataSource = new MatTableDataSource<Carpet>([]);
  
  selection = new SelectionModel<Carpet>(true, []);
  selectedDesigner: string = '';
  pendingSampleAssignTask: Carpet | null = null;
  pendingSampleAssignDesigner: string = '';
  pendingSampleAssignDate: string = '';
  pendingSampleAssignUrgent: boolean = false;

  private carpetService = inject(CarpetService);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private activityLogService = inject(ActivityLogService);
  private notifService = inject(NotificationService);

  designers: User[] = [];
  

  revisionComment: { [key: string]: string } = {};

    bulkArtworkDate: Date = new Date();
  trackByCarpetId(index: number, item: Carpet) { return item.id; }
  trackByFlattened(index: number, row: any) { return row.carpet?.id; }
  
  async assignIndividual(task: any) {
    if (task.selectedDesigner) {
      await this.carpetService.updateCarpet(task.id, {
        designer: task.selectedDesigner,
        designer_readiness_date: task.designer_readiness_date || new Date(),
        status: 'Assigned',
        status_updated_at: new Date()
      });
      alert('Assigned successfully');
    }
  }
  
  approveUndertaking(task: any, designerName: string) {
    task.selectedDesigner = designerName;
    this.assignIndividual(task);
  }
  
  async confirmSampleAssign() {
    if (!this.pendingSampleAssignTask) return;
    const carpet = this.pendingSampleAssignTask;
    try {
      await this.carpetService.updateCarpet(carpet.id!, {
        designer: this.pendingSampleAssignDesigner,
        status: 'Assigned',
        type_of_work: 'Sample',
        is_urgent: this.pendingSampleAssignUrgent,
        status_updated_at: new Date()
      });
      this.dialog.closeAll();
    } catch (e) {
      console.error(e);
      alert('Failed to assign sample.');
    }
  }

  
  sentToAmSelection = new SelectionModel<Carpet>(true, []);
  pendingUndertakingDataSource = new MatTableDataSource<Carpet>([]);
  

  followUpAMProject(group: any) {}
  reviseWithComment(task: any) {}
  skipSample(task: any) {}
  openSampleAssignDialog(task: any, designerName: string) {
    this.promptSampleAssign(task, designerName);
  }
  

  
  formatDate(ts: any): string {
    if (!ts) return '-';
    if (ts.toDate) return ts.toDate().toLocaleDateString();
    if (ts instanceof Date) return ts.toLocaleDateString();
    if (typeof ts === 'string') return new Date(ts).toLocaleDateString();
    return '-';
  }
  promptReassign(task: any) {}
  flattenedActiveWork: any[] = [];
  sentToAmDataSource = new MatTableDataSource<Carpet>([]);
  sendSelectedToProduction() {}
  sentToAmGroups: any[] = [];
  
  toggleGroup(group: any) {
    group.isExpanded = !group.isExpanded;
  }
  
  toggleProjectSelection(group: any) {
    const isSelected = this.isProjectSelected(group);
    if (isSelected) {
      this.sentToAmSelection.deselect(...group.carpets);
    } else {
      this.sentToAmSelection.select(...group.carpets);
    }
  }

  isProjectSelected(group: any) {
    return group.carpets.length > 0 && group.carpets.every((c: any) => this.sentToAmSelection.isSelected(c));
  }
  
  isProjectIndeterminate(group: any) {
    const selectedCount = group.carpets.filter((c: any) => this.sentToAmSelection.isSelected(c)).length;
    return selectedCount > 0 && selectedCount < group.carpets.length;
  }
  
  promptSampleAssign(task: any, designerName: string) {}
  activeDataSource = new MatTableDataSource<Carpet>([]);
  saveComment(task: any) {}
  hasFiles(task: any) { return false; }
  viewFiles(task: any) {}

  ngOnInit() {
    this.userService.getUsers().subscribe(users => {
      this.designers = users.filter(u => u.role === 'Designer');
    });

            this.carpetService.getAllCarpets().subscribe(carpets => {
      this.dataSource.data = carpets.filter(c => c.status === 'Need to Assign');
      this.reviewDataSource.data = carpets.filter(c => c.status === 'Review Pending' || c.status === 'Pending SC Review');
      
      const active = carpets.filter(c => c.status === 'Assigned' || c.status === 'In Progress');
      this.activeDataSource.data = active;
      
      const sortedActive = [...active].sort((a, b) => (a.designer || '').localeCompare(b.designer || ''));
      this.flattenedActiveWork = [];
      let currentDesigner = null;
      for (const carpet of sortedActive) {
        if (carpet.designer !== currentDesigner) {
          this.flattenedActiveWork.push({ designer: carpet.designer || 'Unassigned', carpet: carpet });
          currentDesigner = carpet.designer;
        } else {
          this.flattenedActiveWork.push({ designer: null, carpet: carpet });
        }
      }

      const sentToAm = carpets.filter(c => c.status === 'Sent to AM');
      this.sentToAmDataSource.data = sentToAm;
      
      const groupMap = new Map<string, any>();
      for (const c of sentToAm) {
        if (!groupMap.has(c.project_fk)) {
          groupMap.set(c.project_fk, {
            project_id: c.project_fk,
            project_name: c.project_name,
            isExpanded: true,
            carpets: []
          });
        }
        groupMap.get(c.project_fk).carpets.push(c);
      }
      this.sentToAmGroups = Array.from(groupMap.values());

      this.pendingUndertakingDataSource.data = carpets.filter(c => c.status === 'Pending Undertaking');
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
