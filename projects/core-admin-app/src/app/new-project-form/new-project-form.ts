import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';

import { ProjectService, UserService, NotificationService, PushService, SettingsService, MicrosoftGraphService } from 'shared-core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-project-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatIconModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatSelectModule,
    MatCardModule
  ],
  templateUrl: './new-project-form.html',
  styleUrl: './new-project-form.css'
})
export class NewProjectForm implements OnInit {
  projectForm: FormGroup;
  allProjects: any[] = [];
  amUsers: any[] = [];
  
  clients: string[] = [];
  filteredClients: string[] = [];
  ams: string[] = [];
  filteredAms: string[] = [];

  qualities = ['HT-450', 'HT-550', 'HT-650', 'HT-750', 'HT-850'];

  appSettings: any;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private userService: UserService,
    private notifService: NotificationService,
    private pushService: PushService,
    private router: Router,
    private settingsService: SettingsService,
    private graphService: MicrosoftGraphService
  ) {
    this.projectForm = this.fb.group({
      project_name: ['', Validators.required],
      client_name: ['', Validators.required],
      country: ['', Validators.required],
      am: ['', Validators.required],
      client_expectation_date: [null, Validators.required],
      advance_payment: [false],
      skip_artwork: [false],
      carpets: this.fb.array([])
    });
    this.addCarpet();
  }

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe(s => {
      this.appSettings = s;
    });
    this.userService.getUsers().subscribe(users => {
      this.amUsers = users.filter(u => u.role === 'AM');
      this.ams = this.amUsers.map(u => u.name);
      this.filteredAms = this.ams;
    });
    this.projectService.getProjects().subscribe(projects => {
      this.allProjects = projects;
      const uniqueClients = [...new Set(projects.map(p => p.client_name))];
      this.clients = uniqueClients;
      this.filteredClients = uniqueClients;
    });
    
    this.projectService.getNextSkuNumber().then(num => {
      this.nextSkuStart = num;
    });
  }

  nextSkuStart = 0;

  get carpets() {
    return this.projectForm.get('carpets') as FormArray;
  }

  get projectId(): string {
    const nextId = 26001 + this.allProjects.length;
    return `P-${nextId}`;
  }

  getSku(index: number): string {
    if (this.nextSkuStart === 0) return 'Loading SKU...';
    return `BSH_CC_${(this.nextSkuStart + index).toString().padStart(5, '0')}`;
  }

  addCarpet() {
    const carpetForm = this.fb.group({
      name: ['', Validators.required],
      size: [''],
      width: [null],
      height: [null],
      area: [null],
      quality: ['', Validators.required],
      material: ['', Validators.required],
      carpet_type: ['Rug', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      dimensions_from: [''],
      taher_details: ['']
    });
    this.carpets.push(carpetForm);
  }

  removeCarpet(index: number) {
    if (this.carpets.length > 1) {
      this.carpets.removeAt(index);
    }
  }

  calculateArea(index: number) {
    const carpetGroup = this.carpets.at(index) as FormGroup;
    const w = carpetGroup.get('width')?.value || 0;
    const h = carpetGroup.get('height')?.value || 0;
    if (w > 0 && h > 0) {
      const area = (w * h).toFixed(2);
      carpetGroup.get('area')?.setValue(area, { emitEvent: false });
      carpetGroup.get('size')?.setValue(`${w} x ${h} m`, { emitEvent: false });
    } else {
      carpetGroup.get('area')?.setValue(null, { emitEvent: false });
      carpetGroup.get('size')?.setValue('', { emitEvent: false });
    }
  }

  filterClients(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredClients = this.clients.filter(c => c.toLowerCase().includes(filterValue));
  }

  filterAms(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredAms = this.ams.filter(c => c.toLowerCase().includes(filterValue));
  }

  isSubmitting = false;

  async onSubmit(formDirective: any) {
    if (this.isSubmitting) return;
    
    if (this.projectForm.valid) {
      const formValue = { ...this.projectForm.value };
      
      const isDuplicate = this.allProjects.some(p => p.client_name.toLowerCase() === formValue.client_name.toLowerCase() && p.project_name.toLowerCase() === formValue.project_name.toLowerCase());
      if (isDuplicate) {
        alert('A project with this exact Client Name and Project Name already exists! Please choose a different project name.');
        return;
      }

      this.isSubmitting = true;
      try {
        const carpetsToCreate = formValue.carpets;
        delete formValue.carpets;
        formValue.project_id = this.projectId;

                  

        // Auto-generate Workspace Folders for each carpet seamlessly!
        let folderErrors = [];
        for (let i = 0; i < carpetsToCreate.length; i++) {
          const carpet = carpetsToCreate[i];
          const sku = this.getSku(i);
          try {
            const webUrl = await this.graphService.createProjectWorkspace(
              formValue.project_name, 
              sku, 
              this.appSettings?.sharepointSiteUrl, 
              'ProLoom_Workspace'
            );
            carpet.designer_folder_link = webUrl;
            carpet.designer_folder_path = 'ProLoom_Workspace/' + formValue.project_name + '/' + sku;
          } catch (folderErr: any) {
            console.error('Failed to create folder for ' + sku, folderErr);
            folderErrors.push('SKU ' + sku + ': ' + folderErr.message);
          }
        }

        await this.projectService.addProject(formValue, carpetsToCreate);

        if (folderErrors.length > 0) {
          alert('Project created, but SharePoint folders FAILED to generate:\n\n' + folderErrors.join('\n') + '\n\nPlease check Admin Settings for the SharePoint URL.');
        }

        // Notify the AM
        const assignedAmName = formValue.am;
        const amUser = this.amUsers.find(u => u.name === assignedAmName);
        if (amUser) {
          await this.notifService.sendNotification({
            recipient_email: amUser.email,
            message: `You have been assigned a new project: ${formValue.project_name}`,
            read_status: false,
            timestamp: new Date()
          });

          if (amUser.fcmTokens && amUser.fcmTokens.length > 0) {
            this.pushService.sendPushNotification(
              amUser.fcmTokens,
              'New Project Assigned',
              `You have a new project: ${formValue.project_name}`
            );
          }
        }
        
        alert('Project Created Successfully!');
        
        formDirective.resetForm({
          skip_artwork: false,
          am: ''
        });
        
        while (this.carpets.length !== 0) {
          this.carpets.removeAt(0);
        }
        this.addCarpet();
        
        this.router.navigate(['/projects']);

      } catch (e) {
        // Error already handled
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.projectForm.markAllAsTouched();
    }
  }
}



