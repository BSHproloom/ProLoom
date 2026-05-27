import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { NotificationBellComponent, UserService, User } from 'shared-core';

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
    MatSelectModule,
    FormsModule,
    NotificationBellComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('Carpet Control - Designer Workspace');
  isSidebarOpen = true;

  private userService = inject(UserService);
  designers: User[] = [];
  currentDesigner: User | null = null;

  ngOnInit() {
    this.userService.getUsers().subscribe(users => {
      this.designers = users.filter(u => u.role === 'Designer');
      if (this.designers.length > 0 && !this.currentDesigner) {
        this.currentDesigner = this.designers[0];
        // In a real app with Auth, we wouldn't need this mock state globally like this,
        // but for now we'll save it to local storage or just rely on passing it around.
        // Actually, simplest is to store in localStorage so my-tasks component can read it.
        if (!localStorage.getItem('current_designer')) {
          localStorage.setItem('current_designer', JSON.stringify(this.currentDesigner));
        } else {
          this.currentDesigner = JSON.parse(localStorage.getItem('current_designer')!);
        }
      }
    });
  }

  onDesignerChange() {
    if (this.currentDesigner) {
      localStorage.setItem('current_designer', JSON.stringify(this.currentDesigner));
      // Reload page to refresh my-tasks data with new identity
      window.location.reload();
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
