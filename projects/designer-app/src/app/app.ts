import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MsalService } from '@azure/msal-angular';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { UserService, User, LoginComponent, NotificationBellComponent, CarpetService, NotificationService } from 'shared-core';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatSelectModule,
    FormsModule,
    LoginComponent,
    NotificationBellComponent,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('Carpet Control - Designer Workspace');
  isSidebarOpen = false; // default collapsed

  private userService = inject(UserService);
  private carpetService = inject(CarpetService);
  private notificationService = inject(NotificationService);
  private snackBar = inject(MatSnackBar);
  private msalService = inject(MsalService);
  
  designers: User[] = [];
  currentDesigner: User | null = null;
  loginError = '';
  pendingTasksCount = 0;
  pendingYarnCount = 0;
  private toastedNotifs = new Set<string>();

  ngOnInit() {
    const ls = localStorage.getItem('current_designer');
    if (ls) {
      try {
        this.currentDesigner = JSON.parse(ls);
        if (!this.currentDesigner || !this.currentDesigner.name) {
           throw new Error('Corrupted identity');
        }
        this.userService.currentUser$.next(this.currentDesigner);
        this.requestNotificationPermission();
        this.initData();
      } catch (e) {
        localStorage.removeItem('current_designer');
        this.currentDesigner = null;
        this.userService.currentUser$.next(null);
      }
    }

    this.userService.getUsers().subscribe(users => {
      this.designers = users.filter(u => u.role === 'Designer');
      if (this.currentDesigner && users.length > 0) {
        const valid = this.designers.find(d => d.id === this.currentDesigner!.id && d.role === 'Designer');
        if (!valid) {
          this.currentDesigner = null;
          localStorage.removeItem('current_designer');
          this.userService.currentUser$.next(null);
        } else {
          this.currentDesigner = valid; // update with latest data
          localStorage.setItem('current_designer', JSON.stringify(valid));
        }
      }
    });
  }

  initData() {
    if (this.currentDesigner) {
      this.carpetService.getCarpetsForDesigner(this.currentDesigner.name).subscribe(carpets => {
        const activeStatuses = ['Assigned', 'In Progress', 'Revision Requested', 'Revision Needed', 'Prod File Revision Needed'];
        this.pendingTasksCount = carpets.filter(t => activeStatuses.includes(t.status)).length;
        this.pendingYarnCount = carpets.filter(c => 
          !activeStatuses.includes(c.status) && 
          c.yarn_sheet_updated !== true &&
          c.type_of_work !== 'Sample'
        ).length;
      });

      this.notificationService.getUserNotifications(this.currentDesigner.email).subscribe(notifs => {
        const unread = notifs.filter(n => !n.read_status);
        for (const n of unread) {
          if (n.id && !this.toastedNotifs.has(n.id)) {
            this.toastedNotifs.add(n.id);
            this.snackBar.open(n.message, 'Close', {
              duration: 5000,
              horizontalPosition: 'right',
              verticalPosition: 'bottom'
            });
          }
        }
      });
    }
  }

  onMicrosoftLoginSubmit(email: string) {
    // Always fetch fresh from Firestore to avoid race condition where
    // this.designers may still be empty when redirect returns
    this.userService.getUsers().subscribe(users => {
      const allDesigners = users.filter(u => u.role === 'Designer');
      this.designers = allDesigners;
      const match = allDesigners.find(d => d.email.toLowerCase() === email.toLowerCase() && d.role === 'Designer');
      if (match) {
        this.currentDesigner = match;
        localStorage.setItem('current_designer', JSON.stringify(match));
        this.userService.currentUser$.next(match);
        this.loginError = '';
        this.initData();
        this.requestNotificationPermission();
      } else {
        this.loginError = `No designer account found for ${email}. Please contact admin.`;
      }
    });
  }



  async requestNotificationPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const { getMessaging, getToken } = await import('firebase/messaging');
        const { firebaseApp } = await import('shared-core');
        const messaging = getMessaging(firebaseApp);
        
        const token = await getToken(messaging, {
          vapidKey: 'bTQ7lB_gPz8diPo63sCZi9e01wCdPjjWDqGKdZd9VNU'
        }).catch(e => {
          console.warn('Error getting token', e);
          return null;
        });

        if (token) {
          const ls = localStorage.getItem('current_designer');
          if (ls) {
            const currentDesigner = JSON.parse(ls);
            if (currentDesigner && currentDesigner.id) {
              await this.userService.saveFcmToken(currentDesigner.id, token);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission', error);
    }
  }

  hasTabAccess(tabId: string): boolean {
    if (!this.currentDesigner) return false;
    if (!this.currentDesigner.allowedTabs) return true; // default to all if undefined
    return this.currentDesigner.allowedTabs.includes(tabId);
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  onNavClick() {
    if (window.innerWidth < 768) {
      this.isSidebarOpen = false;
    }
  }

  logout() {
    localStorage.removeItem('current_designer');
    this.currentDesigner = null;
    const account = this.msalService.instance.getAllAccounts()[0];
    if (account) {
      this.msalService.logoutRedirect({ account });
    } else {
      this.msalService.logoutRedirect();
    }
  }
}
