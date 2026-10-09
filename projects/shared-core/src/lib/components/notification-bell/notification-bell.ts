import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from '../../services/notification.service';
import { Notification as AppNotification } from '../../models/notification.model';

@Component({
  selector: 'lib-notification-bell',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatBadgeModule, MatButtonModule, MatMenuModule, MatSnackBarModule],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="notifMenu" class="bell-button">
      <mat-icon [matBadge]="unreadCount" [matBadgeHidden]="unreadCount === 0" matBadgeColor="warn">
        notifications
      </mat-icon>
    </button>
    
    <mat-menu #notifMenu="matMenu" class="notification-menu" xPosition="before">
      <div class="notif-header">
        <h3>Notifications</h3>
      </div>
      
      <div class="notif-list" (click)="$event.stopPropagation()">
        <ng-container *ngIf="notifications.length > 0; else noNotifs">
          <div *ngFor="let notif of notifications" 
               class="notif-item" 
               [class.unread]="!notif.read_status"
               (click)="markAsRead(notif)">
            <p>{{ notif.message }}</p>
            <small>{{ formatTime(notif.timestamp) }}</small>
          </div>
        </ng-container>
        <ng-template #noNotifs>
          <div class="empty-state">
            <p>You have no notifications.</p>
          </div>
        </ng-template>
      </div>
    </mat-menu>
  `,
  styles: [`
    .bell-button { margin-right: 8px; }
    .notification-menu { max-width: 350px; }
    .notif-header { padding: 12px 16px; border-bottom: 1px solid #eee; }
    .notif-header h3 { margin: 0; font-size: 16px; font-weight: 500; }
    .notif-list { max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; }
    .notif-item { padding: 12px 16px; border-bottom: 1px solid #f5f5f5; cursor: pointer; transition: background 0.2s; }
    .notif-item:hover { background-color: #f9f9f9; }
    .notif-item.unread { background-color: #e3f2fd; }
    .notif-item p { margin: 0 0 4px 0; font-size: 14px; line-height: 1.4; color: #333; }
    .notif-item small { font-size: 12px; color: #888; }
    .empty-state { padding: 24px; text-align: center; color: #888; }
  `]
})
export class NotificationBellComponent implements OnInit, OnChanges {
  @Input() recipientEmail?: string;
  @Input() recipientRole?: string;

  private notifService = inject(NotificationService);
  private snackBar = inject(MatSnackBar);
  
  notifications: AppNotification[] = [];
  unreadCount = 0;

  ngOnInit() {
    this.loadNotifications();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['recipientEmail'] && !changes['recipientEmail'].firstChange) {
      this.loadNotifications();
    }
  }

  loadNotifications() {
    import('rxjs').then(({ combineLatest, of }) => {
      const email$ = this.recipientEmail ? this.notifService.getUserNotifications(this.recipientEmail) : of([]);
      const role$ = this.recipientRole ? this.notifService.getRoleNotifications(this.recipientRole) : of([]);
      
      combineLatest([email$, role$]).subscribe(([emailNotifs, roleNotifs]) => {
        // Merge and sort
        const merged = [...emailNotifs, ...roleNotifs];
        // Remove duplicates by ID in case any overlap somehow
        const unique = merged.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        // Sort descending
        unique.sort((a, b) => {
          const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
          const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
          return timeB - timeA;
        });

        this.notifications = unique;
        this.unreadCount = unique.filter(n => !n.read_status).length;
        this.triggerBrowserPush(unique);
      });
    });
  }

  // Simple tracking array to prevent duplicate push notifications per session
  private pushedNotifIds = new Set<string>();

  triggerBrowserPush(notifs: AppNotification[]) {
    const now = new Date().getTime();
    const unread = notifs.filter(n => {
      if (n.read_status) return false;
      
      // Prevent spamming old unread notifications on page reload
      // Only push notifications created in the last 2 minutes
      const notifTime = n.timestamp.toDate ? n.timestamp.toDate().getTime() : new Date(n.timestamp).getTime();
      const isRecent = (now - notifTime) < (2 * 60 * 1000);
      return isRecent;
    });

    unread.forEach(n => {
      if (n.id && !this.pushedNotifIds.has(n.id)) {
        this.pushedNotifIds.add(n.id);
        
        // Show in-app snackbar alert
        this.snackBar.open(n.message, 'Close', {
          duration: 6000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });

        // Show OS-level notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('ProLoom Update', {
            body: n.message,
            icon: '/logo.png' // App public folder
          });
        }
      }
    });
  }

  async markAsRead(notif: AppNotification) {
    if (!notif.read_status && notif.id) {
      await this.notifService.markAsRead(notif.id);
    }
    // If it has a link URL, navigate to it (can use router)
  }

  formatTime(timestamp: any): string {
    if (!timestamp) return '';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleString();
  }
}
