import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-project-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule
  ],
  templateUrl: './new-project-form.html',
  styleUrl: './new-project-form.css',
})
export class NewProjectForm {
  private fb = inject(FormBuilder);

  projectForm: FormGroup = this.fb.group({
    client_name: ['', Validators.required],
    project_name: ['', Validators.required],
    width: [null, [Validators.required, Validators.min(0.1)]],
    height: [null, [Validators.required, Validators.min(0.1)]],
    carpet_quality: ['', Validators.required],
    no_of_rugs: [1, [Validators.required, Validators.min(1)]],
    type_of_carpet: ['', Validators.required],
    timeline_weeks: [null, Validators.required],
    client_commitment_date: [null, Validators.required],
    client_expectation: [''],
    skip_artwork: [false]
  });

  clients = ['Marriott', 'Hilton', 'Ritz-Carlton', 'Hyatt']; // Mock data
  filteredClients = this.clients;

  qualities = ['ht-450', 'ht-550', 'ht-650', 'ht-750', 'ht-850'];
  types = ['WALL TO WALL', 'RUG', 'INSERT'];

  filterClients(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredClients = this.clients.filter(c => c.toLowerCase().includes(filterValue));
  }

  onSubmit() {
    if (this.projectForm.valid) {
      console.log('Project Data:', this.projectForm.value);
      // Here we would call the service to save to Firestore
      alert('Project Created!');
      this.projectForm.reset();
    }
  }
}
