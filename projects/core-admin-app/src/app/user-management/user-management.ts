import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { UserService, User } from 'shared-core';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatCardModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagement implements OnInit {
  private userService = inject(UserService);
  
  users: User[] = [];
  displayedColumns = ['name', 'role', 'password', 'actions'];

  editingUserId: string | null = null;
  editPasswordValue: string = '';

  ngOnInit() {
    this.userService.getUsers().subscribe(users => {
      this.users = users;
    });
  }

  startEdit(user: User) {
    this.editingUserId = user.id!;
    this.editPasswordValue = user.password || '';
  }

  async savePassword(user: User) {
    if (user.id && this.editPasswordValue) {
      await this.userService.updateUserPassword(user.id, this.editPasswordValue);
      this.editingUserId = null;
    }
  }

  cancelEdit() {
    this.editingUserId = null;
  }
}
