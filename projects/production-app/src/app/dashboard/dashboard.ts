import { Component, OnInit, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CarpetService, Carpet, ActivityLogService, NotificationService, ProjectService } from 'shared-core';

@Component({
  selector: 'app-update-status-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, MatButtonModule, MatDialogModule, MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>Update Factory Status</h2>
    <mat-dialog-content>
      <div *ngIf="clientExpectationDate" style="background: #eff6ff; padding: 12px; border-radius: 8px; margin-top: 8px; border: 1px solid #bfdbfe; color: #1e3a8a;">
        <strong>Client Expectation Date:</strong> {{ clientExpectationDate | date }}
        <div style="margin-top: 8px;">
          <button mat-stroked-button color="primary" type="button" (click)="useClientDate()">Accept Client Date</button>
        </div>
      </div>
      <form [formGroup]="form" style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px; min-width: 300px;">
        <mat-form-field appearance="outline">
          <mat-label>New Status</mat-label>
          <mat-select formControlName="status" required>
            <mat-option value="In Tufting">In Tufting</mat-option>
            <mat-option value="In Finishing">In Finishing</mat-option>
            <mat-option value="Ready for Delivery">Ready for Delivery</mat-option>
            <mat-option value="QC Failed">QC Failed</mat-option>
          </mat-select>
        </mat-form-field>
        
        <div *ngIf="form.get('status')?.value === 'In Tufting'" style="display: flex; flex-direction: column; gap: 16px;">
          <mat-form-field appearance="outline">
            <mat-label>Assign Loom (1-12)</mat-label>
            <mat-select formControlName="assigned_loom">
              <mat-option *ngFor="let l of [1,2,3,4,5,6,7,8,9,10,11,12]" [value]="l">Loom {{l}}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Scheduled Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="loom_start_date">
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Scheduled End (Est. Tufting Completion)</mat-label>
            <input matInput [matDatepicker]="tuftingPicker" formControlName="estimated_tufting_date">
            <mat-datepicker-toggle matIconSuffix [for]="tuftingPicker"></mat-datepicker-toggle>
            <mat-datepicker #tuftingPicker></mat-datepicker>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" *ngIf="form.get('status')?.value === 'In Finishing'">
          <mat-label>Estimated Finishing Completion</mat-label>
          <input matInput [matDatepicker]="finishingPicker" formControlName="estimated_finishing_date">
          <mat-datepicker-toggle matIconSuffix [for]="finishingPicker"></mat-datepicker-toggle>
          <mat-datepicker #finishingPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Factory Notes</mat-label>
          <textarea matInput formControlName="notes"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!form.valid" (click)="submit()">Update</button>
    </mat-dialog-actions>
  `
})
export class UpdateStatusDialog implements OnInit {
  form: FormGroup;
  clientExpectationDate: Date | null = null;
  private projectService = inject(ProjectService);
  constructor(
    private fb: FormBuilder, 
    public dialogRef: MatDialogRef<UpdateStatusDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { carpet: Carpet, defaultStatus?: string }
  ) {
    this.form = this.fb.group({
      status: [data.defaultStatus || '', Validators.required],
      estimated_tufting_date: [data.carpet?.estimated_tufting_date?.toDate ? data.carpet.estimated_tufting_date.toDate() : data.carpet?.estimated_tufting_date || null],
      estimated_finishing_date: [data.carpet?.estimated_finishing_date?.toDate ? data.carpet.estimated_finishing_date.toDate() : data.carpet?.estimated_finishing_date || null],
      assigned_loom: [data.carpet?.assigned_loom || null],
      loom_start_date: [data.carpet?.loom_start_date?.toDate ? data.carpet.loom_start_date.toDate() : data.carpet?.loom_start_date || new Date()],
      notes: ['']
    });

    this.form.get('status')?.valueChanges.subscribe(status => {
      const tuftingControl = this.form.get('estimated_tufting_date');
      if (status === 'In Tufting') {
        tuftingControl?.setValidators([Validators.required]);
      } else {
        tuftingControl?.clearValidators();
      }
      tuftingControl?.updateValueAndValidity();
    });

    if (data.defaultStatus === 'In Tufting') {
      this.form.get('estimated_tufting_date')?.setValidators([Validators.required]);
      this.form.get('estimated_tufting_date')?.updateValueAndValidity();
    }
  }

  ngOnInit() {
    this.projectService.getProjectById(this.data.carpet.project_fk).subscribe(proj => {
      if (proj && proj.client_expectation_date) {
        this.clientExpectationDate = proj.client_expectation_date;
      }
    });
  }

  useClientDate() {
    if (this.clientExpectationDate) {
      this.form.patchValue({ estimated_tufting_date: this.clientExpectationDate });
    }
  }

  submit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  pendingCarpets: Carpet[] = [];
  activeCarpets: Carpet[] = [];
  displayedColumns = ['id', 'name', 'size', 'type', 'status', 'dates', 'actions'];

  private carpetService = inject(CarpetService);
  private activityLogService = inject(ActivityLogService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  ngOnInit() {
    this.carpetService.getAllCarpets().subscribe(carpets => {
      // Pending jobs are those assigned but not yet started
      this.pendingCarpets = carpets.filter(c => 
        c.status === 'Assigned to Production' || 
        c.status === 'Assigned' && (c.id!.includes('-SampleFile') || c.id!.includes('-SampleRev') || c.id!.includes('-ProdFile'))
      );

      // Active jobs are those currently on the floor
      this.activeCarpets = carpets.filter(c => 
        c.status === 'In Tufting' || 
        c.status === 'In Finishing' || 
        c.status === 'In Production'
      );
    });
  }

  startProduction(carpet: Carpet) {
    const dialogRef = this.dialog.open(UpdateStatusDialog, {
      data: { carpet, defaultStatus: 'In Tufting' }
    });
    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        await this.handleDialogResult(carpet, result);
      }
    });
  }

  openUpdateDialog(carpet: Carpet) {
    const dialogRef = this.dialog.open(UpdateStatusDialog, {
      data: { carpet }
    });
    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        await this.handleDialogResult(carpet, result);
      }
    });
  }

  async handleDialogResult(carpet: Carpet, result: any) {
    try {
      const updateData: Partial<Carpet> = { status: result.status };
      if (result.status === 'In Tufting' && !carpet.start_time) {
        updateData.start_time = new Date();
      }
      if (result.estimated_tufting_date) {
        updateData.estimated_tufting_date = result.estimated_tufting_date;
        updateData.loom_end_date = result.estimated_tufting_date; // Est. Tufting is the Loom End date
      }
      if (result.estimated_finishing_date) {
        updateData.estimated_finishing_date = result.estimated_finishing_date;
      }
      if (result.assigned_loom) {
        updateData.assigned_loom = result.assigned_loom;
      }
      if (result.loom_start_date) {
        updateData.loom_start_date = result.loom_start_date;
      }

      await this.carpetService.updateCarpet(carpet.id!, updateData);
      
      await this.activityLogService.logActivity({
        carpet_id: carpet.id!,
        project_id: carpet.project_fk,
        user_name: 'Factory Floor',
        action: result.status,
        comment: result.notes || `Status updated to ${result.status}`,
        timestamp: new Date()
      });

      await this.notificationService.sendNotification({
        recipient_email: '',
        recipient_role: 'AM',
        message: `Carpet ${carpet.composite_item_name} status is now ${result.status}.${result.notes ? ' Notes: ' + result.notes : ''}`,
        read_status: false,
        timestamp: new Date()
      });

      if (result.status === 'QC Failed') {
        await this.notificationService.sendNotification({
          recipient_email: 'admin@proloom.com',
          recipient_role: 'Admin',
          message: `URGENT: QC Failed for Carpet ${carpet.composite_item_name} at the Factory. Please investigate. Notes: ${result.notes}`,
          read_status: false,
          timestamp: new Date()
        });
      }

    } catch (e) {
      alert('Failed to update status');
    }
  }

  async requestFileRevision(carpet: Carpet) {
    const reason = window.prompt(`Request file revision for ${carpet.composite_item_name}. \nWhy is this untuftable? (You can send photos via WhatsApp)`);
    if (reason !== null) {
      try {
        await this.carpetService.updateCarpet(carpet.id!, { status: 'Production File Issue' });
        
        await this.activityLogService.logActivity({
          carpet_id: carpet.id!,
          project_id: carpet.project_fk,
          user_name: 'Factory Floor',
          action: 'Production File Issue',
          comment: `File untuftable. Notes: ${reason}`,
          timestamp: new Date()
        });

        await this.notificationService.sendNotification({
          recipient_email: 'admin@proloom.com',
          recipient_role: 'Admin',
          message: `URGENT: Factory flagged Production File Issue for ${carpet.composite_item_name}. Notes: ${reason}`,
          read_status: false,
          timestamp: new Date()
        });

        alert('Issue flagged to Admin successfully.');
      } catch (e) {
        alert('Failed to flag issue.');
      }
    }
  }
}
