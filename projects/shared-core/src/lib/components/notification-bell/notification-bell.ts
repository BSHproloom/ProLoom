import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { NotificationService } from '../../services/notification.service';
import { Notification as AppNotification } from '../../models/notification.model';

@Component({
  selector: 'lib-notification-bell',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatBadgeModule, MatButtonModule, MatMenuModule],
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
    if (this.recipientEmail) {
      this.notifService.getUserNotifications(this.recipientEmail).subscribe(notifs => {
        this.notifications = notifs;
        this.unreadCount = notifs.filter(n => !n.read_status).length;
        this.triggerBrowserPush(notifs);
      });
    }
  }

  // Simple tracking array to prevent duplicate push notifications per session
  private pushedNotifIds = new Set<string>();

  triggerBrowserPush(notifs: AppNotification[]) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const unread = notifs.filter(n => !n.read_status);
    unread.forEach(n => {
      if (n.id && !this.pushedNotifIds.has(n.id)) {
        this.pushedNotifIds.add(n.id);
        new Notification('ProLoom Update', {
          body: n.message,
          icon: '/logo.png' // App public folder
        });
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
