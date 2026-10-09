import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EmailTemplate } from '../../services/settings.service';

export interface EmailComposerData {
  template: EmailTemplate;
  projectName: string;
  projectId: string;
  taskId: string;
  amName: string;
  fileLinksText: string;
}

@Component({
  selector: 'lib-email-composer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>Compose Email</h2>
    <mat-dialog-content>
      <div class="composer-container">
        <mat-checkbox [(ngModel)]="sendEmail" color="primary" class="send-toggle">
          Send Email Notification
        </mat-checkbox>

        <ng-container *ngIf="sendEmail">
          <div class="form-row">
            <mat-form-field appearance="outline" class="flex-field">
              <mat-label>To</mat-label>
              <input matInput [(ngModel)]="data.template.to" placeholder="client@example.com">
            </mat-form-field>
            <mat-form-field appearance="outline" class="flex-field">
              <mat-label>CC</mat-label>
              <input matInput [(ngModel)]="data.template.cc">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Subject</mat-label>
            <input matInput [(ngModel)]="data.template.subject">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Changes Made / Revisions</mat-label>
            <textarea matInput [(ngModel)]="changesMade" rows="3" placeholder="Describe any revisions or specific changes made to the files..."></textarea>
            <mat-hint>This will be included in the email and saved to the Activity Log.</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email Body</mat-label>
            <textarea matInput [(ngModel)]="bodyContent" rows="8"></textarea>
          </mat-form-field>
        </ng-container>
        <ng-container *ngIf="!sendEmail">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Changes Made / Revisions</mat-label>
            <textarea matInput [(ngModel)]="changesMade" rows="3" placeholder="Describe any revisions or specific changes made to the files..."></textarea>
            <mat-hint>This will be saved to the Activity Log.</mat-hint>
          </mat-form-field>
        </ng-container>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSend()" [disabled]="sendEmail && !data.template.to">
        <mat-icon>{{ sendEmail ? 'send' : 'check' }}</mat-icon>
        {{ sendEmail ? 'Send & Complete' : 'Complete Without Email' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .composer-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 500px;
      padding-top: 8px;
    }
    .send-toggle {
      margin-bottom: 8px;
      font-weight: 500;
    }
    .form-row {
      display: flex;
      gap: 16px;
    }
    .flex-field {
      flex: 1;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class EmailComposerComponent {
  sendEmail = true;
  changesMade = '';
  bodyContent = '';

  constructor(
    public dialogRef: MatDialogRef<EmailComposerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmailComposerData
  ) {
    // Make sure we have a fresh copy of the body content
    this.bodyContent = this.data.template.body;
    this.updateBodyPlaceholders();
  }

  updateBodyPlaceholders() {
    let b = this.bodyContent;
    b = b.replace(/\[Project Name\]/gi, this.data.projectName || '');
    b = b.replace(/\[Project ID\]/gi, this.data.projectId || '');
    b = b.replace(/\[Task ID\]/gi, this.data.taskId || '');
    b = b.replace(/\[AM\]/gi, this.data.amName || '');
    b = b.replace(/\[File Links\]/gi, this.data.fileLinksText || '');
    this.bodyContent = b;
    
    let s = this.data.template.subject;
    s = s.replace(/\[Project Name\]/gi, this.data.projectName || '');
    s = s.replace(/\[Project ID\]/gi, this.data.projectId || '');
    s = s.replace(/\[Task ID\]/gi, this.data.taskId || '');
    s = s.replace(/\[AM\]/gi, this.data.amName || '');
    this.data.template.subject = s;
  }

  onSend() {
    if (this.sendEmail) {
      // Replace [Changes Made] placeholder just before sending
      let finalBody = this.bodyContent;
      if (finalBody.includes('[Changes Made]')) {
        finalBody = finalBody.replace(/\[Changes Made\]/gi, this.changesMade || 'None specified');
      } else if (this.changesMade) {
        finalBody = `Changes Made:\n${this.changesMade}\n\n` + finalBody;
      }
      
      this.dialogRef.close({
        send: true,
        to: this.data.template.to,
        cc: this.data.template.cc,
        subject: this.data.template.subject,
        body: finalBody,
        changesMade: this.changesMade
      });
    } else {
      this.dialogRef.close({ send: false, changesMade: this.changesMade });
    }
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
