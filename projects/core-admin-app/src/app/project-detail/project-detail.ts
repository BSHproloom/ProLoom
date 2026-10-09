import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ProjectService, UserService, User, Carpet, NotificationService, CarpetService, ActivityLogService, PushService, MicrosoftGraphService, SettingsService, AppSettings } from 'shared-core';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-email-draft-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Review Email Draft</h2>
    <mat-dialog-content>
      <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px; min-width: 500px;">
        <mat-form-field appearance="outline">
          <mat-label>To</mat-label>
          <input matInput [(ngModel)]="data.to">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>CC</mat-label>
          <input matInput [(ngModel)]="data.cc">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Subject</mat-label>
          <input matInput [(ngModel)]="data.subject">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Message Body</mat-label>
          <textarea matInput rows="10" [(ngModel)]="data.body"></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="data">Send Email</button>
    </mat-dialog-actions>
  `
})
export class EmailDraftDialog {
  constructor(
    public dialogRef: MatDialogRef<EmailDraftDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { to: string, cc: string, subject: string, body: string }
  ) {}
}

@Component({
  selector: 'app-add-carpet-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Add Carpet to Project</h2>
    <mat-dialog-content>
      <form [formGroup]="form" style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px; min-width: 300px;">
        <mat-form-field appearance="outline">
          <mat-label>Carpet Name / Identifier</mat-label>
          <input matInput formControlName="composite_item_name" placeholder="e.g. Lobby Main Rug" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Carpet Type</mat-label>
          <mat-select formControlName="carpet_type" required>
            <mat-option value="Rug">Rug</mat-option>
            <mat-option value="wall to wall">Wall to Wall</mat-option>
            <mat-option value="inserted">Inserted</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Size</mat-label>
          <input matInput formControlName="size" placeholder="L x W" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Quality</mat-label>
          <mat-select formControlName="quality" required>
            <mat-option value="HT-450">HT-450</mat-option>
            <mat-option value="HT-550">HT-550</mat-option>
            <mat-option value="HT-650">HT-650</mat-option>
            <mat-option value="HT-750">HT-750</mat-option>
            <mat-option value="HT-850">HT-850</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Material Blend</mat-label>
          <mat-select formControlName="material" required>
            <mat-option value="75% Wool and 25% Silk">75% Wool and 25% Silk</mat-option>
            <mat-option value="100% Wool">100% Wool</mat-option>
            <mat-option value="100% Silk">100% Silk</mat-option>
            <mat-option value="75% Silk and 25% Wool">75% Silk and 25% Wool</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>No. of Rugs</mat-label>
          <input matInput type="number" formControlName="no_of_rugs" required min="1">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!form.valid" (click)="submit()">Add Carpet</button>
    </mat-dialog-actions>
  `
})
export class AddCarpetDialog {
  form: FormGroup;
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddCarpetDialog>
  ) {
    this.form = this.fb.group({
      composite_item_name: ['', Validators.required],
      size: ['', Validators.required],
      quality: ['', Validators.required],
      carpet_type: ['Rug', Validators.required],
      material: ['', Validators.required],
      no_of_rugs: [1, [Validators.required, Validators.min(1)]]
    });
  }

  submit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}

@Component({
  selector: 'app-edit-project-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatDialogModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    <h2 mat-dialog-title>Edit Project Details</h2>
    <mat-dialog-content>
      <form [formGroup]="form" style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px; min-width: 350px;">
        <mat-form-field appearance="outline">
          <mat-label>Client Name</mat-label>
          <input matInput formControlName="client_name" required>
        </mat-form-field>
        
        <mat-form-field appearance="outline">
          <mat-label>Project Name</mat-label>
          <input matInput formControlName="project_name" required>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Sales Order Number</mat-label>
          <input matInput formControlName="sales_order">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Account Manager (AM)</mat-label>
          <mat-select formControlName="am" required>
            <mat-option *ngFor="let am of amUsers" [value]="am.name">{{ am.name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Timeline (Weeks)</mat-label>
          <input matInput type="number" formControlName="timeline_weeks" required>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Client Expectation Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="client_expectation_date">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!form.valid" (click)="submit()">Save Changes</button>
    </mat-dialog-actions>
  `
})
export class EditProjectDialog {
  form: FormGroup;
  amUsers: User[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditProjectDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { project: any, amUsers: User[] }
  ) {
    this.amUsers = data.amUsers;
    this.form = this.fb.group({
      client_name: [data.project.client_name, Validators.required],
      project_name: [data.project.project_name, Validators.required],
      sales_order: [data.project.sales_order || ''],
      am: [data.project.am, Validators.required],
      timeline_weeks: [data.project.timeline_weeks, Validators.required],
      client_expectation_date: [data.project.client_expectation_date]
    });
  }

  submit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}

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
    MatFormFieldModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css'
})
export class ProjectDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private userService = inject(UserService);
  private notifService = inject(NotificationService);
  private carpetService = inject(CarpetService);
  private activityLogService = inject(ActivityLogService);
  private pushService = inject(PushService);
  private dialog = inject(MatDialog);
  private graphService = inject(MicrosoftGraphService);
  private settingsService = inject(SettingsService);

  projectId: string = '';
  project: any = null;
  carpets: Carpet[] = [];
  designers: User[] = [];
  amUsers: User[] = [];
  logs: any[] = [];
  projectFiles: any[] = [];
  isLoadingFiles = false;
  isLoadingProject = true;
  appSettings?: AppSettings;

  displayedColumns: string[] = ['sku', 'name', 'size', 'folder', 'status', 'designer', 'actions'];

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    if (this.projectId) {
      this.loadData();
    }

    this.settingsService.getSettings().subscribe(settings => {
      this.appSettings = settings || this.settingsService.getDefaultSettings();
    });
    
    this.userService.getUsers().subscribe(users => {
      this.designers = users.filter(u => u.role === 'Designer');
      this.amUsers = users.filter(u => u.role === 'AM');
    });
  }

  loadData() {
    this.isLoadingProject = true;
    this.projectService.getProjectById(this.projectId).subscribe(async project => {
      this.project = project;
      this.isLoadingProject = false;
      
      // Load OneDrive files if connected
      if (this.project?.onedrive_folder_path) {
        this.isLoadingFiles = true;
        try {
          this.projectFiles = await this.graphService.getFolderFiles(this.project.onedrive_folder_path);
        } catch (e) {
          console.error('Failed to load project files from OneDrive', e);
        } finally {
          this.isLoadingFiles = false;
        }
      }
    });

    this.carpetService.getCarpetsForProject(this.projectId).subscribe(carpets => {
      this.carpets = carpets;
    });

    this.activityLogService.getLogsForProject(this.projectId).subscribe(logs => {
      this.logs = logs;
    });
  }

  openEditProjectDialog() {
    if (!this.project) return;
    const dialogRef = this.dialog.open(EditProjectDialog, {
      width: '500px',
      data: { project: this.project, amUsers: this.amUsers }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          await this.projectService.updateProject(this.projectId, result);
          alert('Project details updated successfully!');
        } catch (e) {
          console.error(e);
          alert('Failed to update project details.');
        }
      }
    });
  }

  async deleteProject() {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await this.projectService.deleteProject(this.projectId);
        alert('Project deleted successfully.');
        this.router.navigate(['/projects']);
      } catch (error) {
        alert('Failed to delete project. Check console.');
        console.error(error);
      }
    }
  }

  isOverdue(carpet: Carpet): boolean {
    if (!carpet.designer_readiness_date) return false;
    // Don't show overdue if it's already submitted or completed
    if (['Pending SC Review', 'Sent to AM', 'Approved', 'Ready'].includes(carpet.status)) return false;
    
    const date = (carpet.designer_readiness_date as any).toDate ? (carpet.designer_readiness_date as any).toDate() : new Date(carpet.designer_readiness_date);
    const now = new Date();
    return date.getTime() < now.getTime();
  }

  calculateDaysAging(carpet: Carpet): number {
    if (!['Sent to AM', 'On Hold - Client Decision'].includes(carpet.status)) {
      return 0;
    }
    
    if (!carpet.status_updated_at) {
      return 0; // Legacy data without timestamp
    }
    
    const updateTime = carpet.status_updated_at.toDate ? carpet.status_updated_at.toDate().getTime() : new Date(carpet.status_updated_at).getTime();
    const now = new Date().getTime();
    return Math.floor((now - updateTime) / (1000 * 60 * 60 * 24));
  }

  openAddCarpetDialog() {
    const dialogRef = this.dialog.open(AddCarpetDialog, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          const carpetData = {
            ...result,
            project_fk: this.projectId,
            designer: '',
            status: 'Need to Assign',
            is_working: false,
            time_spent_seconds: 0
          };
          await this.carpetService.addCarpet(carpetData);
          alert('Carpet successfully added!');
          this.loadData(); // Reload carpets list
        } catch (e) {
          console.error(e);
          alert('Failed to add carpet.');
        }
      }
    });
  }

  async assignDesigner(carpet: Carpet, designerName: string) {
    if (!designerName) return;

    // Optimistic UI update
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
      
      // Find designer email to send notification
      const d = this.designers.find(u => u.name === designerName);
      if (d) {
        await this.notifService.sendNotification({
          recipient_email: d.email,
          message: `You have been assigned to carpet ${carpet.composite_item_name} (${carpet.id}) for project ${this.project?.project_name}`,
          read_status: false,
          timestamp: new Date()
        });
        
        // Pop up the new Email Draft Dialog for Artwork Assignment
        await this.sendAdminEmail('admin_artwork_assignment', carpet, d.email, 'Please review the attached brief and provide the artwork.');
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
    } catch (e) {
      alert('Failed to assign designer.');
    }
  }

  async approveArtwork(carpet: Carpet) {
    if (confirm('Approve artwork and send to AM?')) {
      try {
        await this.carpetService.updateCarpet(carpet.id!, {
          status: 'Sent to AM'
        });
        this.loadData();
      } catch (e) {
        alert('Failed to approve.');
      }
    }
  }

  async requestRevision(carpet: Carpet) {
    const designerEmail = this.designers.find(u => u.name === carpet.designer)?.email || '';
    const emailResult = await this.sendAdminEmail('admin_revision_request', carpet, designerEmail, 'Enter revision notes here');
    if (!emailResult) return; // User cancelled the dialog

    const reason = emailResult.body.substring(0, 100) + '...'; // extract part of email body as reason

    try {
      // 1. Mark original as Revision Requested
      await this.carpetService.updateCarpet(carpet.id!, {
        status: 'Revision Requested'
      });

      // 2. Determine new revision ID
      const revMatch = carpet.id!.match(/-Rev(\d+)$/);
      let newRevNum = 1;
      let baseId = carpet.id!;
      if (revMatch) {
        newRevNum = parseInt(revMatch[1], 10) + 1;
        baseId = carpet.id!.replace(/-Rev\d+$/, '');
      }
      const newId = `${baseId}-Rev${newRevNum}`;

      // 3. Create sub-task
      const newCarpet: any = {
        ...carpet,
        status: 'Assigned',
        is_working: false,
        time_spent_seconds: 0,
        manual_hours_spent: 0,
        yarn_sheet_updated: false,
        designer_readiness_date: null,
        start_time: null,
        assigned_date: new Date()
      };
      
      delete newCarpet.id;
      
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('shared-core');
      
      await setDoc(doc(db, 'carpets', newId), newCarpet);

      // Generate Microsoft Graph Folder for the Revision
      try {
        const amName = this.project?.am || 'Unassigned_AM';
        const projectNameSanitized = this.project?.project_name?.replace(/[\/\\:*?"<>|]/g, '-') || 'Unknown_Project';
        const carpetNameSanitized = carpet.composite_item_name?.replace(/[\/\\:*?"<>|]/g, '-') || 'Unknown_Carpet';
        const revFolder = `Revision_${newRevNum}`;
        
        const carpetPath = `ProLoom_Workspace/${amName}/${this.projectId}_${projectNameSanitized}/${baseId}_${carpetNameSanitized}/${revFolder}`;
        await this.graphService.getOrCreateFolderPath(carpetPath);
        console.log(`Successfully generated OneDrive folder for ${revFolder}`);
      } catch (graphError) {
        console.error('Failed to generate Graph folder for revision:', graphError);
        // Non-blocking error, user can still proceed
      }

      // Log it
      await this.activityLogService.logActivity({
        carpet_id: carpet.id!,
        project_id: carpet.project_fk,
        user_name: 'SC Admin',
        action: 'Revision Requested',
        comment: `Reason: ${reason}. Created sub-task ${newId}.`,
        timestamp: new Date()
      });

      alert(`Revision requested. New sub-task ${newId} created.`);
      this.loadData();

    } catch (e) {
      console.error(e);
      alert('Failed to request revision.');
    }
  }

  async requestSampleFile(carpet: Carpet) {
    if (!carpet.designer) {
      alert('Carpet needs a designer assigned first.');
      return;
    }

    const designerEmail = this.designers.find(u => u.name === carpet.designer)?.email || '';
    const emailResult = await this.sendAdminEmail('admin_sample_request', carpet, designerEmail);
    if (!emailResult) return; // User cancelled the dialog

    try {
      const newId = `${carpet.id}-SampleFile`;
      const newCarpet: any = {
        ...carpet,
        status: 'Assigned',
        is_working: false,
        time_spent_seconds: 0,
        manual_hours_spent: 0,
        yarn_sheet_updated: false,
        designer_readiness_date: null,
        start_time: null,
        assigned_date: new Date()
      };
      delete newCarpet.id;
      
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('shared-core');
      await setDoc(doc(db, 'carpets', newId), newCarpet);

      // Generate Microsoft Graph Folder for the Sample
      try {
        const amName = this.project?.am || 'Unassigned_AM';
        const projectNameSanitized = this.project?.project_name?.replace(/[\/\\:*?"<>|]/g, '-') || 'Unknown_Project';
        const carpetNameSanitized = carpet.composite_item_name?.replace(/[\/\\:*?"<>|]/g, '-') || 'Unknown_Carpet';
        const baseId = carpet.id!;
        const revFolder = `SampleFile`;
        
        const carpetPath = `ProLoom_Workspace/${amName}/${this.projectId}_${projectNameSanitized}/${baseId}_${carpetNameSanitized}/${revFolder}`;
        await this.graphService.getOrCreateFolderPath(carpetPath);
        console.log(`Successfully generated OneDrive folder for ${revFolder}`);
      } catch (graphError) {
        console.error('Failed to generate Graph folder:', graphError);
      }

      await this.activityLogService.logActivity({
        carpet_id: carpet.id!,
        project_id: carpet.project_fk,
        user_name: 'SC Admin',
        action: 'Sample File Requested',
        comment: `Created sample file task ${newId} for designer ${carpet.designer}.`,
        timestamp: new Date()
      });

      alert(`Sample file task ${newId} created for designer.`);
      this.loadData();
    } catch (e) {
      console.error(e);
      alert('Failed to request sample file.');
    }
  }

  async assignToProduction(carpet: Carpet) {
    if (confirm('Assign this sample to Production?')) {
      try {
        await this.carpetService.updateCarpet(carpet.id!, {
          status: 'In Production'
        });
        
        await this.activityLogService.logActivity({
          carpet_id: carpet.id!,
          project_id: carpet.project_fk,
          user_name: 'SC Admin',
          action: 'Assigned to Production',
          comment: `Assigned sample file ${carpet.id} to production.`,
          timestamp: new Date()
        });

        // Notify Production
        await this.notifService.sendNotification({
          recipient_role: 'Production',
          recipient_email: '',
          message: `Carpet ${carpet.composite_item_name} has been assigned to Production.`,
          read_status: false,
          timestamp: new Date()
        });

        this.userService.getUsers().subscribe(users => {
          const prodUsers = users.filter(u => u.role === 'Production');
          const tokens: string[] = [];
          prodUsers.forEach(u => {
            if (u.fcmTokens) tokens.push(...u.fcmTokens);
          });
          if (tokens.length > 0) {
            this.pushService.sendPushNotification(
              tokens,
              'New Production Assignment',
              `Carpet ${carpet.composite_item_name} has been assigned to Production.`
            );
          }
        });

        this.loadData();
      } catch (e) {
        alert('Failed to assign to production.');
      }
    }
  }

  async requestSampleRevision(carpet: Carpet) {
    const reason = prompt('Enter reason for sample revision:');
    if (reason === null) return;

    try {
      // Mark current as Revision Requested
      await this.carpetService.updateCarpet(carpet.id!, {
        status: 'Revision Requested'
      });

      // Determine new revision ID
      const baseMatch = carpet.id!.match(/^(.*?)(-SampleFile|-SampleRev\d+)$/);
      let baseId = carpet.id!;
      let newRevNum = 1;
      
      if (baseMatch) {
        baseId = baseMatch[1];
        const revMatch = carpet.id!.match(/-SampleRev(\d+)$/);
        if (revMatch) {
          newRevNum = parseInt(revMatch[1], 10) + 1;
        }
      }
      
      const newId = `${baseId}-SampleRev${newRevNum}`;

      const newCarpet: any = {
        ...carpet,
        status: 'Assigned',
        is_working: false,
        time_spent_seconds: 0,
        manual_hours_spent: 0,
        yarn_sheet_updated: false,
        designer_readiness_date: null,
        start_time: null,
        assigned_date: new Date()
      };
      delete newCarpet.id;
      
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('shared-core');
      await setDoc(doc(db, 'carpets', newId), newCarpet);

      await this.activityLogService.logActivity({
        carpet_id: carpet.id!,
        project_id: carpet.project_fk,
        user_name: 'SC Admin',
        action: 'Sample Revision Requested',
        comment: `Reason: ${reason}. Created sub-task ${newId}.`,
        timestamp: new Date()
      });

      alert(`Sample revision requested. New sub-task ${newId} created.`);
      this.loadData();

    } catch (e) {
      console.error(e);
      alert('Failed to request sample revision.');
    }
  }

  async setHoldStatus(carpet: Carpet, status: string) {
    if (confirm(`Set carpet status to "${status}"?`)) {
      try {
        await this.carpetService.updateCarpet(carpet.id!, { status });
        await this.activityLogService.logActivity({
          carpet_id: carpet.id!,
          project_id: carpet.project_fk,
          user_name: 'SC Admin',
          action: 'Paused',
          comment: `Status changed to ${status}`,
          timestamp: new Date()
        });
        this.loadData();
      } catch (e) {
        alert('Failed to update status.');
      }
    }
  }

  async resumeFromHold(carpet: Carpet) {
    if (confirm(`Resume carpet workflow? This sets it back to "Sent to AM".`)) {
      try {
        await this.carpetService.updateCarpet(carpet.id!, { status: 'Sent to AM' });
        await this.activityLogService.logActivity({
          carpet_id: carpet.id!,
          project_id: carpet.project_fk,
          user_name: 'SC Admin',
          action: 'Started',
          comment: `Resumed from hold.`,
          timestamp: new Date()
        });
        this.loadData();
      } catch (e) {
        alert('Failed to update status.');
      }
    }
  }

  async requestProductionFile(carpet: Carpet) {
    if (!carpet.designer) {
      alert('Carpet needs a designer assigned first.');
      return;
    }

    const designerEmail = this.designers.find(u => u.name === carpet.designer)?.email || '';
    const emailResult = await this.sendAdminEmail('admin_prod_request', carpet, designerEmail);
    if (!emailResult) return; // User cancelled the dialog

    try {
      const newId = `${carpet.id}-ProdFile`;
      const newCarpet: any = {
        ...carpet,
        status: 'Assigned',
        is_working: false,
        time_spent_seconds: 0,
        manual_hours_spent: 0,
        yarn_sheet_updated: false,
        designer_readiness_date: null,
        start_time: null,
        assigned_date: new Date()
      };
      delete newCarpet.id;
      
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('shared-core');
      await setDoc(doc(db, 'carpets', newId), newCarpet);

      await this.activityLogService.logActivity({
        carpet_id: carpet.id!,
        project_id: carpet.project_fk,
        user_name: 'SC Admin',
        action: 'Production File Requested' as any,
        comment: `Created production file task ${newId} for designer ${carpet.designer}.`,
        timestamp: new Date()
      });

      alert(`Production file task ${newId} created for designer.`);
      this.loadData();
    } catch (e) {
      console.error(e);
      alert('Failed to request production file.');
    }
  }

  async setYarnEta(carpet: Carpet) {
    const etaStr = prompt('Enter Yarn ETA (YYYY-MM-DD):');
    if (!etaStr) return;

    const etaDate = new Date(etaStr);
    if (isNaN(etaDate.getTime())) {
      alert('Invalid date format.');
      return;
    }

    try {
      await this.carpetService.updateCarpet(carpet.id!, {
        yarn_eta: etaDate
      });

      await this.activityLogService.logActivity({
        carpet_id: carpet.id!,
        project_id: carpet.project_fk,
        user_name: 'SC Admin',
        action: 'Yarn ETA Set',
        comment: `Yarn ETA set to ${etaDate.toLocaleDateString()}`,
        timestamp: new Date()
      });

      // Notify AM
      if (this.project?.am) {
        const ams = await new Promise<User[]>(resolve => {
          this.userService.getUsers().subscribe(u => resolve(u));
        });
        const am = ams.find(u => u.name === this.project.am);
        if (am) {
          await this.notifService.sendNotification({
            recipient_email: am.email,
            message: `Yarn ETA for Carpet ${carpet.composite_item_name} has been set to ${etaDate.toLocaleDateString()}. Please inform the client.`,
            read_status: false,
            timestamp: new Date()
          });
        }
      }

      alert('Yarn ETA updated and AM notified.');
      this.loadData();
    } catch (e) {
      alert('Failed to set Yarn ETA.');
    }
  }

  async requestProdFileRevision(carpet: Carpet) {
    if (confirm(`Send Production File ${carpet.composite_item_name} back to Designer for fixes?`)) {
      try {
        await this.carpetService.updateCarpet(carpet.id!, { status: 'Prod File Revision Needed' });
        
        await this.activityLogService.logActivity({
          carpet_id: carpet.id!,
          project_id: carpet.project_fk,
          user_name: 'SC Admin',
          action: 'Prod File Revision Needed',
          comment: `Factory reported issue with production file. Sent back to Designer.`,
          timestamp: new Date()
        });

        // Notify Designer
        if (carpet.designer) {
          const d = this.designers.find(u => u.name === carpet.designer);
          if (d) {
            await this.notifService.sendNotification({
              recipient_email: d.email,
              message: `URGENT: Factory flagged an issue with Production File for ${carpet.composite_item_name}. Please check WhatsApp for images and fix immediately.`,
              read_status: false,
              timestamp: new Date()
            });
          }
        }

        alert('Sent back to designer.');
        this.loadData();
      } catch (e) {
        alert('Failed to send back to designer.');
      }
    }
  }

  async sendAdminEmail(scenario: string, carpet: Carpet, defaultTo: string, defaultReason: string = ''): Promise<{subject: string, body: string} | null> {
    if (!this.appSettings) return null;
    
    const template = this.appSettings.emailTemplates[scenario] || this.appSettings.emailTemplates['admin_artwork_assignment'];
    const designerName = carpet.designer || 'Designer';
    const projectName = this.project?.project_name || 'Unknown Project';
    const carpetName = carpet.composite_item_name || 'Unknown Carpet';
    const sku = carpet.id || 'Unknown SKU';
    
    let subject = template.subject || '';
    let body = template.body || '';
    
    const replacements: Record<string, string> = {
      '\\[Project_Name\\]': projectName,
      '\\[Carpet_Name\\]': carpetName,
      '\\[SKU\\]': sku,
      '\\[Designer_Name\\]': designerName,
      '\\[Folder_Link\\]': 'Check your OneDrive / ProLoom Workspace folder',
      '\\[Notes\\]': defaultReason
    };

    for (const [key, val] of Object.entries(replacements)) {
      const regex = new RegExp(key, 'gi');
      subject = subject.replace(regex, val);
      body = body.replace(regex, val);
    }
    
    return new Promise((resolve) => {
      const dialogRef = this.dialog.open(EmailDraftDialog, {
        width: '600px',
        data: {
          to: defaultTo,
          cc: template.cc || '',
          subject: subject,
          body: body
        }
      });

      dialogRef.afterClosed().subscribe(async (result) => {
        if (result) {
          try {
            await this.graphService.sendEmail([result.to], result.subject, result.body);
            alert('Email sent via Microsoft Graph');
          } catch(e) {
            console.error(e);
            const mailto = `mailto:${result.to}?subject=${encodeURIComponent(result.subject)}&body=${encodeURIComponent(result.body)}`;
            window.open(mailto, '_blank');
          }
          resolve({ subject: result.subject, body: result.body });
        } else {
          resolve(null);
        }
      });
    });
  }
}
