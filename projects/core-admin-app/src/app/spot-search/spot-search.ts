import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ProjectService, CarpetService, Project, Carpet } from 'shared-core';

interface SearchOption {
  type: 'Project' | 'Client' | 'Carpet';
  label: string;
  id: string; // The primary ID to route to
  projectId?: string; // Parent project ID if it's a carpet
  icon: string;
}

@Component({
  selector: 'app-spot-search',
  standalone: true,
  imports: [CommonModule, MatInputModule, MatFormFieldModule, MatIconModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule],
  templateUrl: './spot-search.html',
  styleUrl: './spot-search.css',
})
export class SpotSearchComponent implements OnInit, AfterViewInit {
  private dialogRef = inject(MatDialogRef<SpotSearchComponent>);
  private projectService = inject(ProjectService);
  private carpetService = inject(CarpetService);
  private router = inject(Router);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  
  searchControl = new FormControl('');
  options: SearchOption[] = [];
  filteredOptions!: Observable<SearchOption[]>;

  ngOnInit() {
    this.loadSearchData();

    this.filteredOptions = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 100);
  }

  loadSearchData() {
    this.projectService.getProjects().subscribe(projects => {
      // Map Projects and Clients
      projects.forEach(p => {
        this.options.push({
          type: 'Project',
          label: `Project: ${p.id}`,
          id: p.id,
          icon: 'folder'
        });
        
        if (p.client_expectation_date) {
          this.options.push({
            type: 'Client',
            label: `Client/Details: ${p.client_expectation_date.toString().substring(0, 50)}... (Proj: ${p.id})`,
            id: p.id,
            icon: 'person'
          });
        }
      });
      
      this.carpetService.getAllCarpets().subscribe((carpets: Carpet[]) => {
        carpets.forEach(c => {
          this.options.push({
            type: 'Carpet',
            label: `SKU: ${c.id} - ${c.composite_item_name}`,
            id: c.id,
            projectId: c.project_fk,
            icon: 'straighten'
          });
        });
      });
    });
  }

  private _filter(value: string): SearchOption[] {
    const filterValue = value.toLowerCase();
    return this.options.filter(option => option.label.toLowerCase().includes(filterValue)).slice(0, 20); // limit to 20 results for performance
  }

  onSelection(event: MatAutocompleteSelectedEvent) {
    const option = event.option.value as SearchOption;
    this.dialogRef.close();
    
    if (option.type === 'Project' || option.type === 'Client') {
      this.router.navigate(['/project', option.id]);
    } else if (option.type === 'Carpet') {
      // Route to parent project as decided
      this.router.navigate(['/project', option.projectId]);
    }
  }

  displayFn(option: SearchOption): string {
    return option && option.label ? option.label : '';
  }

  close() {
    this.dialogRef.close();
  }
}
