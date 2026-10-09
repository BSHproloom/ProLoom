import { Component, signal, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationBellComponent, ProjectService, CarpetService, YarnOrderService, UserService, LoginComponent } from 'shared-core';
import { SpotSearchComponent } from './spot-search/spot-search';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SwUpdate } from '@angular/service-worker';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatBadgeModule,
    MatDialogModule,
    NotificationBellComponent,
    CommonModule,
    MatTooltipModule,
    LoginComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('Pro Loom-Admin');
  isSidebarOpen = true;
  isSettingsOpen = true;
  role: 'Admin' | 'SuperAdmin' | 'SalesCoordinator' = 'SalesCoordinator';
  
  isLoggedIn = false;
  loginError = '';
  currentAdmin: any = null;
  adminUsers: any[] = [];
  private userService = inject(UserService);
  private msalService = inject(MsalService);

  private dialog = inject(MatDialog);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private carpetService = inject(CarpetService);
  private yarnOrderService = inject(YarnOrderService);
  
  private lastSKeyPressTime = 0;
  private isSpotSearchOpen = false;

  pendingAssignCount = 0;
  pendingReviewCount = 0;
  pendingSampleCount = 0;
  pendingYarnCount = 0;
  todoCount = 0;

  ngOnInit() {
    const ls = localStorage.getItem('current_admin');
    if (ls) {
      try {
        this.currentAdmin = JSON.parse(ls);
        this.isLoggedIn = true;
        this.requestNotificationPermission();
      } catch (e) {
        localStorage.removeItem('current_admin');
      }
    }

    this.userService.getUsers().subscribe(users => {
      this.adminUsers = users.filter(u => u.role === 'Admin' || u.role === 'SuperAdmin' || u.role === 'SalesCoordinator');
      if (this.currentAdmin) {
        const valid = this.adminUsers.find(u => u.id === this.currentAdmin.id);
        if (!valid) {
          this.logout();
        } else {
          this.currentAdmin = valid;
          this.role = valid.role as any;
        }
      }
    });

    this.projectService.getProjects().subscribe(projects => {
      let todo = 0;
      projects.forEach(p => {
        const missing = [];
        if (!p.sales_order || p.sales_order === 'Pending') missing.push('Sales Order Number');
        if (!p.client_expectation_date) missing.push('Client Expectation Date');
        if (!p.timeline_weeks) missing.push('Timeline (Weeks)');
        
        if (missing.length > 0 && p.overall_status !== 'Completed') {
          todo++;
        }
      });
      this.todoCount = todo;
    });

    this.carpetService.getAllCarpets().subscribe(carpets => {
      this.pendingAssignCount = carpets.filter(c => c.status === 'Need to Assign').length;
      this.pendingReviewCount = carpets.filter(c => (c.status === 'Review Pending' || c.status === 'Pending SC Review') && c.type_of_work !== 'Sample').length;
      this.pendingSampleCount = carpets.filter(c => (c.status === 'Review Pending' || c.status === 'Pending SC Review') && c.type_of_work === 'Sample').length;
    });

    this.yarnOrderService.getYarnOrders().subscribe(orders => {
      this.pendingYarnCount = orders.filter(o => o.status === 'Pending').length;
    });
  }

  onMicrosoftLoginSubmit(email: string) {
    // Always fetch fresh from Firestore to avoid race condition
    this.userService.getUsers().subscribe(users => {
      this.adminUsers = users.filter(u => u.role === 'Admin' || u.role === 'SuperAdmin' || u.role === 'SalesCoordinator');
      const match = this.adminUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (match) {
        this.currentAdmin = match;
        this.role = match.role as any;
        localStorage.setItem('current_admin', JSON.stringify(match));
        this.isLoggedIn = true;
        this.loginError = '';
        this.requestNotificationPermission();
      } else {
        this.loginError = `No Admin/SC account found for ${email}. Please contact system admin.`;
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleSettings() {
    this.isSettingsOpen = !this.isSettingsOpen;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Only listen to 's' key
    if (event.key?.toLowerCase() !== 's') {
      return;
    }

    // Don't trigger if user is typing in an input or textarea
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    if (this.isSpotSearchOpen) {
      return;
    }

    const currentTime = new Date().getTime();
    if (currentTime - this.lastSKeyPressTime < 400) {
      // Double 's' detected
      this.openSpotSearch();
      // Reset to prevent tripe 's' triggering it again immediately
      this.lastSKeyPressTime = 0;
    } else {
      this.lastSKeyPressTime = currentTime;
    }
  }

  openSpotSearch() {
    this.isSpotSearchOpen = true;
    const dialogRef = this.dialog.open(SpotSearchComponent, {
      width: '600px',
      position: { top: '100px' },
      backdropClass: 'blur-backdrop',
      panelClass: 'spot-search-panel'
    });

    dialogRef.afterClosed().subscribe(() => {
      this.isSpotSearchOpen = false;
    });
  }

  async requestNotificationPermission() {
    try {
      if ('Notification' in window) {
        await Notification.requestPermission();
      }
    } catch (e) {
      console.error('Error requesting notification permission', e);
    }
  }


  logout() {
    localStorage.removeItem('current_admin');
    this.currentAdmin = null;
    const account = this.msalService.instance.getAllAccounts()[0];
    if (account) {
      this.msalService.logoutRedirect({ account });
    } else {
      this.msalService.logoutRedirect();
    }
  }
}
