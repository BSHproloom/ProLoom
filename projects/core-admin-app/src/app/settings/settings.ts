import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ProjectService, UserService, User } from 'shared-core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatButtonModule, 
    MatCardModule, 
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule
  ],
  template: `
    <div class="settings-container">
      <h2>System Settings</h2>

      <!-- Team Management Section -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">group</mat-icon>
          <mat-card-title>Team Directory</mat-card-title>
          <mat-card-subtitle>Manage Account Managers and Designers</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          
          <form [formGroup]="userForm" (ngSubmit)="addUser(formDirective)" #formDirective="ngForm" class="add-user-form">
            <mat-form-field appearance="outline">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" placeholder="John Doe">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="john@proloom.com">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Role</mat-label>
              <mat-select formControlName="role">
                <mat-option value="AM">Account Manager (AM)</mat-option>
                <mat-option value="Designer">Designer</mat-option>
                <mat-option value="Production">Production</mat-option>
                <mat-option value="Admin">Admin</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" [disabled]="!userForm.valid">
              <mat-icon>add</mat-icon> Add User
            </button>
          </form>

          <table mat-table [dataSource]="userService.users$" class="mat-elevation-z1">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef> Name </th>
              <td mat-cell *matCellDef="let user"> {{user.name}} </td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef> Email </th>
              <td mat-cell *matCellDef="let user"> {{user.email}} </td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef> Role </th>
              <td mat-cell *matCellDef="let user"> 
                <span class="role-badge" [ngClass]="user.role.toLowerCase()">{{user.role}}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef> Actions </th>
              <td mat-cell *matCellDef="let user">
                <button mat-icon-button color="warn" (click)="deleteUser(user)" title="Remove User">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" colspan="4">No users found in the directory.</td>
            </tr>
          </table>

        </mat-card-content>
      </mat-card>
      
      <!-- Danger Zone -->
      <mat-card class="danger-zone section-card">
        <mat-card-header>
          <mat-icon mat-card-avatar color="warn">warning</mat-icon>
          <mat-card-title>Danger Zone</mat-card-title>
          <mat-card-subtitle>Destructive actions for the database</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <p>
            Clicking the button below will permanently delete all projects and carpets from the Firestore Database.
            This action cannot be undone. Use this only for testing purposes to reset the system to a clean state.
          </p>
        </mat-card-content>
        
        <mat-card-actions>
          <button mat-raised-button color="warn" (click)="clearDatabase()">
            <mat-icon>delete_forever</mat-icon>
            CLEAR ALL DATA
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .section-card {
      margin-bottom: 24px;
    }
    .danger-zone {
      border: 1px solid #f44336;
    }
    .danger-zone mat-card-header {
      margin-bottom: 16px;
    }
    .add-user-form {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .add-user-form mat-form-field {
      flex: 1;
      min-width: 200px;
    }
    table {
      width: 100%;
    }
    .role-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      color: white;
    }
    .role-badge.am { background-color: #2196f3; }
    .role-badge.designer { background-color: #9c27b0; }
    .role-badge.production { background-color: #ff9800; }
    .role-badge.admin { background-color: #f44336; }
    .mat-cell[colspan="4"] {
      text-align: center;
      padding: 32px;
      color: #666;
    }
  `]
})
export class Settings {
  private ps = inject(ProjectService);
  public userService = inject(UserService);
  private fb = inject(FormBuilder);

  displayedColumns: string[] = ['name', 'email', 'role', 'actions'];

  userForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['AM', Validators.required]
  });

  async addUser(formDirective: any) {
    if (this.userForm.valid) {
      try {
        await this.userService.addUser(this.userForm.value);
        formDirective.resetForm({ role: 'AM' });
      } catch (e) {
        alert('Failed to add user.');
      }
    }
  }

  async deleteUser(user: User) {
    const confirm = window.confirm(`Are you sure you want to remove ${user.name}?`);
    if (confirm && user.id) {
      try {
        await this.userService.deleteUser(user.id);
      } catch (e) {
        alert('Failed to delete user.');
      }
    }
  }

  async clearDatabase() {
    const confirm = window.confirm('Are you absolutely sure you want to clear the entire Firebase database?');
    if (confirm) {
      await this.ps.clearAllData();
      alert('Database cleared successfully!');
    }
  }
}
