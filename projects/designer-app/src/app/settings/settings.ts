import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { User, UserService } from 'shared-core';

@Component({
  selector: 'app-designer-settings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatListModule],
  template: `
    <div class="settings-container">
      <h2>Designer Settings</h2>
      
      <mat-card class="profile-card">
        <mat-card-header>
          <div mat-card-avatar class="avatar">
            <mat-icon>account_circle</mat-icon>
          </div>
          <mat-card-title>{{ designer?.name || 'Loading...' }}</mat-card-title>
          <mat-card-subtitle>{{ designer?.email || 'Loading...' }}</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <mat-list>
            <mat-list-item>
              <mat-icon matListItemIcon>badge</mat-icon>
              <div class="list-item-content">
                <strong>Role:</strong> {{ designer?.role || 'Designer' }}
              </div>
            </mat-list-item>
            <mat-divider></mat-divider>
            <mat-list-item>
              <mat-icon matListItemIcon>lock</mat-icon>
              <div class="list-item-content">
                <strong>Password:</strong> ******** 
                <span class="hint">(Please contact your administrator to change your password)</span>
              </div>
            </mat-list-item>
          </mat-list>
        </mat-card-content>
        <mat-card-actions style="padding: 16px;">
          <button mat-stroked-button color="warn" (click)="logout()" style="width: 100%;">
            <mat-icon>logout</mat-icon> Logout
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
    }
    .profile-card {
      margin-top: 16px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
    }
    .avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
    }
    .avatar mat-icon {
      font-size: 32px;
      height: 32px;
      width: 32px;
      color: #9c27b0;
    }
    .list-item-content {
      padding-left: 16px;
    }
    .hint {
      color: #888;
      font-size: 12px;
      margin-left: 8px;
    }
    mat-card-header {
      margin-bottom: 16px;
    }
  `]
})
export class DesignerSettings implements OnInit {
  designer: User | null = null;
  private userService = inject(UserService);

  ngOnInit() {
    const ls = localStorage.getItem('current_designer');
    if (ls) {
      try {
        const parsed = JSON.parse(ls);
        // Fetch fresh data
        this.userService.getUsers().subscribe(users => {
          const match = users.find(u => u.id === parsed.id);
          if (match) {
            this.designer = match;
            localStorage.setItem('current_designer', JSON.stringify(match));
          } else {
            this.designer = parsed;
          }
        });
      } catch(e) {}
    }
  }

  logout() {
    localStorage.removeItem('current_designer');
    window.location.reload();
  }
}
