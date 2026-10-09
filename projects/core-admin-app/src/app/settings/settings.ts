import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectService, UserService, User, AssetService, Asset, SettingsService, AppSettings, EmailTemplate, MicrosoftGraphService } from 'shared-core';
import { map } from 'rxjs/operators';
import { firstValueFrom, Subscription } from 'rxjs';
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatButtonModule, 
    MatCardModule, 
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="settings-container">
      <h2>System Settings</h2>

      <mat-tab-group dynamicHeight>
        <!-- TEAM DIRECTORY TAB -->
        <mat-tab label="Team Directory">
          <mat-card class="section-card" style="margin-top: 16px;">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">group</mat-icon>
              <mat-card-title>Team Directory</mat-card-title>
              <mat-card-subtitle>Manage Account Managers and Designers</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              
              <form [formGroup]="userForm" (ngSubmit)="addUser(formDirective)" #formDirective="ngForm" class="add-user-form">
                <mat-form-field appearance="outline">
                  <mat-label>Name</mat-label>
                  <input matInput formControlName="name" placeholder="John Doe">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" placeholder="john@proloom.com">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Role</mat-label>
                  <mat-select formControlName="role">
                    <mat-option value="AM">Account Manager (AM)</mat-option>
                    <mat-option value="Designer">Designer</mat-option>
                    <mat-option value="Production">Production</mat-option>
                    <mat-option value="Admin">Admin</mat-option>
                    <mat-option value="SuperAdmin">Super Admin</mat-option>
                  </mat-select>
                </mat-form-field>

                <button mat-raised-button color="primary" type="submit" [disabled]="!userForm.valid">
                  <mat-icon>add</mat-icon> Add User
                </button>
              </form>

              <table mat-table [dataSource]="userService.users$" class="mat-elevation-z1">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef> Name </th>
                  <td mat-cell *matCellDef="let user"> {{user.name}} </td>
                </ng-container>

                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef> Email </th>
                  <td mat-cell *matCellDef="let user"> {{user.email}} </td>
                </ng-container>

                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef> Role </th>
                  <td mat-cell *matCellDef="let user"> 
                    <span class="role-badge" [ngClass]="user.role.toLowerCase()">{{user.role}}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef> Actions </th>
                  <td mat-cell *matCellDef="let user">
                    <button mat-icon-button color="warn" (click)="deleteUser(user)" title="Remove User">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                <tr class="mat-row" *matNoDataRow>
                  <td class="mat-cell" colspan="4">No users found in the directory.</td>
                </tr>
              </table>

            </mat-card-content>
          </mat-card>
        </mat-tab>

        <!-- DESIGNER PERMISSIONS TAB -->
        <mat-tab label="Designer Permissions">
           <mat-card class="section-card" style="margin-top: 16px;">
             <mat-card-header>
               <mat-icon mat-card-avatar color="primary">security</mat-icon>
               <mat-card-title>Designer Tab Permissions</mat-card-title>
               <mat-card-subtitle>Control which tabs each Designer can access in their app</mat-card-subtitle>
             </mat-card-header>
             <mat-card-content>
               <table mat-table [dataSource]="designers$" class="mat-elevation-z1">
                 
                 <ng-container matColumnDef="name">
                   <th mat-header-cell *matHeaderCellDef> Designer </th>
                   <td mat-cell *matCellDef="let user"> <strong>{{user.name}}</strong> </td>
                 </ng-container>
                 
                 <ng-container matColumnDef="tabs">
                   <th mat-header-cell *matHeaderCellDef> Allowed Tabs </th>
                   <td mat-cell *matCellDef="let user">
                      <div style="display: flex; gap: 12px; flex-wrap: wrap; padding: 12px 0;">
                        <mat-checkbox [checked]="hasTab(user, 'my-tasks')" (change)="toggleTab(user, 'my-tasks')">My Tasks</mat-checkbox>
                        <mat-checkbox [checked]="hasTab(user, 'reports')" (change)="toggleTab(user, 'reports')">My Reports</mat-checkbox>
                        <mat-checkbox [checked]="hasTab(user, 'leaderboard')" (change)="toggleTab(user, 'leaderboard')">Leaderboard</mat-checkbox>
                        <mat-checkbox [checked]="hasTab(user, 'yarnsheet-calculator')" (change)="toggleTab(user, 'yarnsheet-calculator')">Yarnsheet Calculator</mat-checkbox>
                        <mat-checkbox [checked]="hasTab(user, 'settings')" (change)="toggleTab(user, 'settings')">Settings</mat-checkbox>
                      </div>
                   </td>
                 </ng-container>
                 
                 <tr mat-header-row *matHeaderRowDef="['name', 'tabs']"></tr>
                 <tr mat-row *matRowDef="let row; columns: ['name', 'tabs'];"></tr>
                 <tr class="mat-row" *matNoDataRow>
                   <td class="mat-cell" colspan="2">No designers found.</td>
                 </tr>
               </table>
             </mat-card-content>
           </mat-card>
        </mat-tab>

        <!-- ASSETS TAB -->
        <mat-tab label="Company Assets">
          <mat-card class="section-card" style="margin-top: 16px;">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">folder_shared</mat-icon>
              <mat-card-title>Company Assets</mat-card-title>
              <mat-card-subtitle>Upload PDFs for Account Managers</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              <div class="upload-area">
                <input type="file" #fileInput (change)="onFileSelected($event)" accept="application/pdf" style="display: none;">
                <button mat-raised-button color="primary" (click)="fileInput.click()" [disabled]="uploadingAsset">
                  <mat-icon>upload</mat-icon> Upload PDF
                </button>
                <div *ngIf="uploadingAsset" style="margin-top: 16px;">
                  <mat-progress-bar mode="determinate" [value]="uploadProgress"></mat-progress-bar>
                  <small>Uploading... {{uploadProgress | number:'1.0-0'}}%</small>
                </div>
              </div>

              <table mat-table [dataSource]="assetService.assets$" class="mat-elevation-z1" style="margin-top: 24px;">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef> Filename </th>
                  <td mat-cell *matCellDef="let asset">
                    <a [href]="asset.downloadUrl" target="_blank">{{asset.name}}</a>
                  </td>
                </ng-container>

                <ng-container matColumnDef="size">
                  <th mat-header-cell *matHeaderCellDef> Size </th>
                  <td mat-cell *matCellDef="let asset"> {{ (asset.size / 1024 / 1024) | number:'1.2-2' }} MB </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef> Actions </th>
                  <td mat-cell *matCellDef="let asset">
                    <button mat-icon-button color="warn" (click)="deleteAsset(asset)" title="Delete Asset">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="['name', 'size', 'actions']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['name', 'size', 'actions'];"></tr>
                <tr class="mat-row" *matNoDataRow>
                  <td class="mat-cell" colspan="3">No company assets uploaded yet.</td>
                </tr>
              </table>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <!-- EMAIL TEMPLATES TAB -->
        <mat-tab label="Email Templates">
          <mat-card class="section-card" style="margin-top: 16px;">
            <mat-card-header>
              <mat-icon mat-card-avatar>email</mat-icon>
              <mat-card-title>Email Configuration & Templates</mat-card-title>
              <mat-card-subtitle>Configure default recipients and dynamically generated email text</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content *ngIf="settingsForm">
              <form [formGroup]="settingsForm" class="settings-form">
                
                <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                  

                  <mat-form-field appearance="outline" style="flex: 1;">
                    <mat-label>SharePoint Site URL (for Projects)</mat-label>
                    <input matInput formControlName="sharepointSiteUrl" placeholder="https://bsh-my.sharepoint.com/sites/CarpetControl">
                  </mat-form-field>
                  
                  
                </div>
                
                <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                  <mat-form-field appearance="outline" style="flex: 1;">
                    <mat-label>Default SC Admin Email (For Designer Submissions)</mat-label>
                    <input matInput formControlName="scEmail">
                  </mat-form-field>
                  <mat-form-field appearance="outline" style="flex: 1;">
                    <mat-label>Default Factory Email (For Production Files)</mat-label>
                    <input matInput formControlName="factoryEmail">
                  </mat-form-field>
                </div>

                <div class="hints" style="margin-bottom: 16px;">
                  <strong>Available Dynamic Tags:</strong><br/>
                  <code>[Project_Name]</code> <code>[Carpet_Name]</code> <code>[SKU]</code> <code>[Designer_Name]</code> <code>[Folder_Link]</code> <code>[Notes]</code>
                  <br/>These tags will automatically be replaced with real data when the email is drafted.
                </div>
                
                <div style="display: flex; gap: 16px; flex-direction: column;">
                  <mat-form-field appearance="outline">
                    <mat-label>Select Scenario to Edit</mat-label>
                    <mat-select [formControl]="selectedScenarioCtrl">
                      <mat-option *ngFor="let key of scenarioKeys" [value]="key">
                        {{ formatScenarioName(key) }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>

                  <div *ngIf="currentTemplateForm" class="template-editor" [formGroup]="currentTemplateForm">
                    <h3>{{ formatScenarioName(selectedScenarioCtrl.value || '') }}</h3>
                    
                    <div style="display: flex; gap: 16px; flex-direction: column;">
                      <mat-form-field appearance="outline">
                        <mat-label>Subject</mat-label>
                        <input matInput formControlName="subject" required>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Body</mat-label>
                        <textarea matInput formControlName="body" rows="8" required></textarea>
                      </mat-form-field>
                    </div>
                  </div>
                </div>
              </form>
            </mat-card-content>
            
            <mat-card-actions align="end">
              <button mat-raised-button color="primary" [disabled]="!settingsForm.valid || isSavingSettings" (click)="saveSettings()">
                <mat-icon *ngIf="!isSavingSettings">save</mat-icon>
                <mat-spinner diameter="20" *ngIf="isSavingSettings"></mat-spinner>
                SAVE SETTINGS
              </button>
            </mat-card-actions>
          </mat-card>
        </mat-tab>

        <!-- DANGER ZONE TAB -->
        <mat-tab label="Database Danger Zone">
          <mat-card class="danger-zone section-card" style="margin-top: 16px;">
            <mat-card-header>
              <mat-icon mat-card-avatar color="warn">warning</mat-icon>
              <mat-card-title>Danger Zone</mat-card-title>
              <mat-card-subtitle>Destructive actions for the database</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              <p>
                Clicking the button below will permanently delete all projects and carpets from the Firestore Database.
                This action cannot be undone. Use this only for testing purposes to reset the system to a clean state.
              </p>
            </mat-card-content>
            
            <mat-card-actions>
              <button mat-raised-button color="warn" (click)="clearDatabase()">
                <mat-icon>delete_forever</mat-icon>
                CLEAR ALL DATA
              </button>
            </mat-card-actions>
          </mat-card>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .section-card {
      margin-bottom: 24px;
    }
    .danger-zone {
      border: 1px solid #f44336;
    }
    .danger-zone mat-card-header {
      margin-bottom: 16px;
    }
    .add-user-form {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .add-user-form mat-form-field {
      flex: 1;
      min-width: 200px;
    }
    table {
      width: 100%;
    }
    .role-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      color: white;
    }
    .role-badge.am { background-color: #2196f3; }
    .role-badge.designer { background-color: #9c27b0; }
    .role-badge.production { background-color: #ff9800; }
    .role-badge.admin { background-color: #f44336; }
    .mat-cell[colspan="4"] {
      text-align: center;
      padding: 32px;
      color: #666;
    }
    .settings-form {
      padding: 16px 0;
    }
    .template-editor {
      background: #fafafa;
      padding: 24px;
      border-radius: 8px;
      border: 1px solid #eee;
    }
    .hints {
      font-size: 13px;
      color: #555;
      background: #e3f2fd;
      padding: 12px;
      border-radius: 6px;
    }
  `]
})
export class Settings {
  private ps = inject(ProjectService);
  public userService = inject(UserService);
  public assetService = inject(AssetService);
  private settingsService = inject(SettingsService);
  private graphService = inject(MicrosoftGraphService);
  private fb = inject(FormBuilder);

  appSettings?: AppSettings;
  settingsForm!: FormGroup;
  selectedScenarioCtrl = this.fb.control('Submitting Production Files');
  scenarioKeys: string[] = [];
  isSavingSettings = false;
  private settingsSub!: Subscription;

  displayedColumns: string[] = ['name', 'email', 'role', 'actions'];

  designers$ = this.userService.users$.pipe(
    map(users => users.filter(u => u.role === 'Designer'))
  );

  userForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['AM', Validators.required]
  });

  

  ngOnInit() {
    this.settingsSub = this.settingsService.getSettings().subscribe(settings => {
      this.appSettings = settings || this.settingsService.getDefaultSettings();
      this.scenarioKeys = Object.keys(this.appSettings.emailTemplates);
      this.initSettingsForm();
    });

    this.selectedScenarioCtrl.valueChanges.subscribe(() => {
      // triggers UI update to show correct template form
    });
  }

  ngOnDestroy() {
    if (this.settingsSub) this.settingsSub.unsubscribe();
  }

  initSettingsForm() {
    if (!this.appSettings) return;

    const templatesGroup: any = {};
    for (const key of this.scenarioKeys) {
      const tmpl = this.appSettings.emailTemplates[key];
      templatesGroup[key] = this.fb.group({
        subject: [tmpl.subject, Validators.required],
        body: [tmpl.body, Validators.required],
        to: [tmpl.to],
        cc: [tmpl.cc]
      });
    }

    this.settingsForm = this.fb.group({
      
      sharepointSiteUrl: [this.appSettings.sharepointSiteUrl || ''],
      scEmail: [this.appSettings.scEmail || ''],
      factoryEmail: [this.appSettings.factoryEmail || ''],
      emailTemplates: this.fb.group(templatesGroup)
    });
  }

  formatScenarioName(key: string): string {
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  get currentTemplateForm(): FormGroup | null {
    if (!this.settingsForm || !this.selectedScenarioCtrl.value) return null;
    const templatesGrp = this.settingsForm.get('emailTemplates') as FormGroup;
    return templatesGrp.get(this.selectedScenarioCtrl.value) as FormGroup;
  }

  async saveSettings() {
    if (this.settingsForm.valid) {
      this.isSavingSettings = true;
      try {
        await this.settingsService.updateSettings(this.settingsForm.value);
        alert('Settings saved successfully!');
      } catch (e: any) {
        alert('Failed to save settings: ' + e.message);
      } finally {
        this.isSavingSettings = false;
      }
    }
  }

  hasTab(user: User, tabId: string): boolean {
    if (!user.allowedTabs) return true; // defaults to true if undefined
    return user.allowedTabs.includes(tabId);
  }

  async toggleTab(user: User, tabId: string) {
    let tabs = user.allowedTabs;
    if (!tabs) {
      tabs = ['my-tasks', 'reports', 'leaderboard', 'yarnsheet-calculator', 'settings'];
    }
    
    if (tabs.includes(tabId)) {
      tabs = tabs.filter(t => t !== tabId);
    } else {
      tabs.push(tabId);
    }
    
    if (user.id) {
      await this.userService.updateUserAllowedTabs(user.id, tabs);
    }
  }

  async addUser(formDirective: any) {
    if (this.userForm.valid) {
      try {
        await this.userService.addUser(this.userForm.value);
        formDirective.resetForm({ role: 'AM' });
      } catch (e) {
        alert('Failed to add user.');
      }
    }
  }

  async deleteUser(user: User) {
    const confirm = window.confirm(`Are you sure you want to remove ${user.name}?`);
    if (confirm && user.id) {
      try {
        await this.userService.deleteUser(user.id);
      } catch (e) {
        alert('Failed to delete user.');
      }
    }
  }

  async clearDatabase() {
    const confirm = window.confirm('Are you absolutely sure you want to clear the entire Firebase database?');
    if (confirm) {
      await this.ps.clearAllData();
      alert('Database cleared successfully!');
    }
  }

  // ASSETS LOGIC
  uploadingAsset = false;
  uploadProgress = 0;

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // 4.5GB Global limit check
    const currentAssets = await firstValueFrom(this.assetService.assets$);
    const totalSize = currentAssets.reduce((sum, asset) => sum + asset.size, 0);
    const maxSize = 4.5 * 1024 * 1024 * 1024; // 4.5 GB

    if (totalSize + file.size > maxSize) {
      alert('Total storage limit (4.5GB) exceeded. Please delete some existing files to free up space.');
      event.target.value = '';
      return;
    }

    this.uploadingAsset = true;
    this.uploadProgress = 0;

    try {
      await this.assetService.uploadAsset(file, (progress) => {
        this.uploadProgress = progress;
      });
      // reset file input
      event.target.value = '';
    } catch (e: any) {
      alert('Upload failed: ' + e.message);
    } finally {
      this.uploadingAsset = false;
    }
  }

  async deleteAsset(asset: Asset) {
    if (confirm(`Delete ${asset.name}?`)) {
      try {
        await this.assetService.deleteAsset(asset);
      } catch (e: any) {
        alert('Delete failed: ' + e.message);
      }
    }
  }
}




