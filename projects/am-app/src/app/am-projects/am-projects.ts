import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectViewModel, Carpet, ProjectService, UserService, CarpetService, User, NotificationBellComponent, FileViewerDialogComponent } from 'shared-core';

interface AmProjectViewModel extends ProjectViewModel {
  carpets: Carpet[];
}

@Component({
  selector: 'app-am-projects',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatExpansionModule, 
    MatIconModule, 
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    NotificationBellComponent,
    MatDialogModule,
    FileViewerDialogComponent
  ],
  templateUrl: './am-projects.html',
  styleUrl: './am-projects.css',
})
export class AmProjects implements OnInit {
  
  allProjects: AmProjectViewModel[] = [];
  projects: AmProjectViewModel[] = [];
  allCarpets: Carpet[] = [];
  
  ams: User[] = [];
  currentAm: User | null = null;
  
  carpetColumns = ['name_sku', 'status', 'designer', 'readiness_date', 'actions'];

  private dialog = inject(MatDialog);

  hasFiles(carpet: Carpet): boolean {
    return !!carpet.files && Object.keys(carpet.files).length > 0;
  }

  viewFiles(carpet: Carpet) {
    this.dialog.open(FileViewerDialogComponent, {
      data: { 
        files: carpet.files,
        remark: carpet.designer_remark
      },
      width: '80vw',
      height: '80vh',
      maxWidth: '1200px'
    });
  }

  private ps = inject(ProjectService);
  private userService = inject(UserService);
  private carpetService = inject(CarpetService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    const ls = localStorage.getItem('current_am');
    if (ls) {
      try {
        const parsed = JSON.parse(ls);
        this.currentAm = parsed;
      } catch (e) {
        localStorage.removeItem('current_am');
      }
    }

    this.userService.getUsers().subscribe(users => {
      this.ams = users.filter(u => u.role === 'AM');
      if (this.currentAm) {
        const actualAm = this.ams.find(a => a.name === this.currentAm!.name);
        if (actualAm) {
          this.currentAm = actualAm;
        }
      }
      this.filterProjects();
    });

    this.carpetService.getAllCarpets().subscribe(carpets => {
      this.allCarpets = carpets;
      this.mapCarpetsToProjects();
    });

    this.ps.getProjects().subscribe(projects => {
      this.allProjects = projects.map(p => ({
        ...p,
        carpets: []
      }));
      this.mapCarpetsToProjects();
    });
  }

  mapCarpetsToProjects() {
    this.allProjects = this.allProjects.map(p => ({
      ...p,
      carpets: this.allCarpets.filter(c => c.project_fk === p.id)
    }));
    this.filterProjects();
  }

  filterProjects() {
    if (this.currentAm) {
      this.projects = this.allProjects.filter(p => p.am === this.currentAm!.name);
    } else {
      this.projects = [];
    }
    this.cdr.detectChanges();
  }
}

