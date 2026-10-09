import { Component, signal, OnInit, inject, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { LoginComponent, User, UserService, NotificationBellComponent } from 'shared-core';
import { MsalService } from '@azure/msal-angular';

// Declare firebase globally since we load it via script or importScripts, 
// or we can import it if we install the firebase package.
declare var firebase: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    LoginComponent,
    NotificationBellComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('Carpet Control - Account Manager');
  private injector = inject(Injector);
  private userService = inject(UserService);
  private msalService = inject(MsalService);

  isSidebarOpen = true;
  ams: User[] = [];
  currentAm: User | null = null;
  loginError = '';

  ngOnInit() {
    const ls = localStorage.getItem('current_am');
    if (ls) {
      try {
        this.currentAm = JSON.parse(ls);
        this.requestNotificationPermission();
      } catch (e) {
        localStorage.removeItem('current_am');
      }
    }

    this.userService.getUsers().subscribe(users => {
      this.ams = users.filter(u => u.role === 'AM');
      if (this.currentAm && this.ams.length > 0) {
        const valid = this.ams.find(a => a.id === this.currentAm!.id);
        if (!valid) {
          this.logout();
        } else {
          this.currentAm = valid;
        }
      }
    });
  }

  onMicrosoftLoginSubmit(email: string) {
    const match = this.ams.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (match) {
      this.currentAm = match;
      localStorage.setItem('current_am', JSON.stringify(match));
      this.loginError = '';
      this.requestNotificationPermission();
    } else {
      this.loginError = `No AM account found for ${email}.`;
    }
  }

  logout() {
    this.currentAm = null;
    localStorage.removeItem('current_am');
    const account = this.msalService.instance.getAllAccounts()[0];
    if (account) {
      this.msalService.logoutRedirect({ account });
    } else {
      this.msalService.logoutRedirect();
    }
  }

  async requestNotificationPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const { getMessaging, getToken } = await import('firebase/messaging');
        const { firebaseApp } = await import('shared-core');
        const messaging = getMessaging(firebaseApp);
        
        const token = await getToken(messaging, {
          vapidKey: 'bTQ7lB_gPz8diPo63sCZi9e01wCdPjjWDqGKdZd9VNU' // Dummy/real VAPID, must match your firebase setup or omit if default config has it. Better yet, we can try to just get it from firebase config.
        }).catch(e => {
          console.warn('Error getting FCM token (Web):', e);
          return null;
        });

        if (token && this.currentAm && this.currentAm.id) {
          await this.userService.saveFcmToken(this.currentAm.id, token);
        }
      }

      // Also try Capacitor for native mobile
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
          PushNotifications.addListener('registration', async (token) => {
            if (this.currentAm && this.currentAm.id) {
              await this.userService.saveFcmToken(this.currentAm.id, token.value);
            }
          });
        }
      } catch (capErr) {
        console.log('Capacitor Push Notifications not available (expected in browser).');
      }
      
    } catch (error) {
      console.log('Push notifications error:', error);
    }
  }
}
