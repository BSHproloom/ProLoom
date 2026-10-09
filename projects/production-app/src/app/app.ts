import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserService, User, LoginComponent, NotificationBellComponent } from 'shared-core';

import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive,
    MatSidenavModule, 
    MatListModule, 
    MatIconModule, 
    MatButtonModule,
    LoginComponent,
    NotificationBellComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  isSidebarOpen = true;
  isLoggedIn = false;
  loginError = '';
  private userService = inject(UserService);
  private msalService = inject(MsalService);
  productionUsers: User[] = [];
  currentProductionUser: User | null = null;

  ngOnInit() {
    const ls = localStorage.getItem('production_user');
    if (ls) {
      try {
        this.currentProductionUser = JSON.parse(ls);
        this.isLoggedIn = true;
        this.requestNotificationPermission();
      } catch (e) {
        localStorage.removeItem('production_user');
      }
    }

    this.userService.getUsers().subscribe(users => {
      this.productionUsers = users.filter(u => u.role === 'Production');
      if (this.currentProductionUser) {
        const valid = this.productionUsers.find(p => p.id === this.currentProductionUser!.id);
        if (!valid) {
          this.currentProductionUser = null;
          this.isLoggedIn = false;
          localStorage.removeItem('production_user');
        } else {
          this.currentProductionUser = valid;
        }
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  onMicrosoftLoginSubmit(email: string) {
    const match = this.productionUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (match) {
      this.currentProductionUser = match;
      localStorage.setItem('production_user', JSON.stringify(match));
      this.isLoggedIn = true;
      this.loginError = '';
      this.requestNotificationPermission();
    } else {
      this.loginError = `No Production account found for ${email}.`;
    }
  }

  logout() {
    localStorage.removeItem('production_user');
    this.currentProductionUser = null;
    this.isLoggedIn = false;
    const account = this.msalService.instance.getAllAccounts()[0];
    if (account) {
      this.msalService.logoutRedirect({ account });
    } else {
      this.msalService.logoutRedirect();
    }
  }

  async requestNotificationPermission() {
    try {
      // 1. Try Capacitor Native Push (Mobile)
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          await PushNotifications.register();

          PushNotifications.addListener('registration', async (token) => {
            if (this.currentProductionUser && this.currentProductionUser.id) {
              await this.userService.saveFcmToken(this.currentProductionUser.id, token.value);
            }
          });

          PushNotifications.addListener('registrationError', (error: any) => {
            console.error('Error on registration: ' + JSON.stringify(error));
          });

          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
          });
          
          return; // Capacitor successful, exit
        }
      }
    } catch (capacitorError) {
      console.warn('Capacitor Push Notifications not available, falling back to Web Push:', capacitorError);
    }

    // 2. Fallback to Web Push (Desktop / Browser)
    try {
      if (!('Notification' in window)) return;
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
          const ls = localStorage.getItem('production_user');
          if (ls) {
            const currentUser = JSON.parse(ls);
            if (currentUser && currentUser.id) {
              await this.userService.saveFcmToken(currentUser.id, token);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error requesting web notification permission', error);
    }
  }
}
