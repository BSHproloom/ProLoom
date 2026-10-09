import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { SampleService } from '../../services/sample.service';
import { SettingsService, AppSettings } from '../../services/settings.service';
import { Sample } from '../../models/sample.model';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { PushService } from '../../services/push.service';
import { ref, uploadBytesResumable, uploadBytes, getDownloadURL } from 'firebase/storage';

@Component({
  selector: 'lib-manual-sample-request',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDividerModule],
  templateUrl: './manual-sample-request.html',
  styleUrl: './manual-sample-request.css'
})
export class ManualSampleRequestComponent implements OnInit {
  @Input() currentApp: 'designer' | 'admin' | 'production' = 'designer';
  
  private sampleService = inject(SampleService);
  private settingsService = inject(SettingsService);
  private userService = inject(UserService);
  private http = inject(HttpClient);
  private notifService = inject(NotificationService);
  private pushService = inject(PushService);

  samples: Sample[] = [];
  appSettings!: AppSettings;
  currentUser: any;
  
  isSubmitting = false;
  uploadProgress = 0;
  
  // Form State
  clientName = '';
  projectName = '';
  sampleSize = '';
  sampleMaterial = '';
  sampleConstruction = '';
  sampleInstructions: string = '';
  selectedFiles: { [key: string]: File } = {};
  pastedOneDriveLinks: string = '';
  isDragging: { [key: string]: boolean } = {};

  sampleSizes = ['0.5 x 0.5m', '0.6 x 0.6m', '1.0 x 1.0m', '1.2 x 1.2m', 'Other'];
  sampleMaterials = ['Wool', 'Silk', 'Viscose', 'Nylon', 'Wool & Silk', 'Wool & Viscose', 'Other'];
  sampleConstructions = ['Cut Pile', 'Loop Pile', 'Cut & Loop', 'Hand Tufted', 'Hand Knotted', 'Axminster', 'Other'];

  ngOnInit() {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!this.currentUser) {
        const ls = localStorage.getItem('current_designer') || localStorage.getItem('current_admin') || localStorage.getItem('current_production');
        if (ls) this.currentUser = JSON.parse(ls);
      }
    });

    this.settingsService.getSettings().subscribe(s => {
      this.appSettings = s || this.settingsService.getDefaultSettings();
    });

    this.sampleService.getSamples().subscribe(samples => {
      if (this.currentApp === 'production') {
        this.samples = samples.filter(s => s.is_manual).sort((a, b) => {
          if (a.status === 'Pending' && b.status !== 'Pending') return -1;
          if (a.status !== 'Pending' && b.status === 'Pending') return 1;
          return 0;
        });
      } else {
        let filtered = samples.filter(s => s.is_manual);
        if (this.currentApp === 'designer' && this.currentUser) {
          filtered = filtered.filter(s => s.designer_name === this.currentUser.name);
        }
        this.samples = filtered.sort((a, b) => {
          return (a.id > b.id) ? -1 : 1;
        });
      }
    });
  }

  onDragOver(event: DragEvent, key: string) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging[key] = true;
  }

  onDragLeave(event: DragEvent, key: string) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging[key] = false;
  }

  onDrop(event: DragEvent, key: string) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging[key] = false;
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      this.selectedFiles[key] = event.dataTransfer.files[0];
    }
  }

  onFileSelect(event: any, key: string) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFiles[key] = event.target.files[0];
    }
  }

  canSubmit(): boolean {
    return !!(
      this.clientName &&
      this.projectName &&
      this.sampleSize &&
      this.sampleMaterial &&
      this.sampleConstruction &&
      this.selectedFiles['main']
    );
  }

  async generatePDF(sampleId: string): Promise<Blob> {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('BSH', 15, 20);
    doc.text('Walls &', 15, 28);
    doc.text('Floors', 15, 36);

    doc.setFontSize(24);
    doc.text('Sample Request Form', 105, 28, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Suite 801 | The Exchange Tower', 195, 20, { align: 'right' });
    doc.text('Business Bay | Dubai | UAE', 195, 25, { align: 'right' });
    doc.text('VAT No. 100291554200003', 195, 30, { align: 'right' });

    doc.setLineWidth(1);
    doc.line(15, 42, 195, 42);

    autoTable(doc, {
      startY: 48,
      theme: 'plain',
      margin: { left: 15, right: 15 },
      styles: { lineColor: [0, 0, 0], lineWidth: 0.1, fontSize: 10, textColor: [0, 0, 0], cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { fontStyle: 'bold', cellWidth: 35 },
        3: { cellWidth: 45 },
      },
      body: [
        ['Company Name', `: ${this.clientName}`, 'Date', `: ${today}`],
        ['Project Name', `: ${this.projectName}`, 'Sample Ref No', `: ${sampleId}`],
        ['Project Status', ': New Request', 'Designer', `: ${this.currentUser?.name || ''}`],
      ]
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      theme: 'grid',
      margin: { left: 15, right: 15 },
      styles: { lineColor: [0, 0, 0], lineWidth: 0.1, fontSize: 10, textColor: [0, 0, 0], cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 60 },
        1: { cellWidth: 120 },
      },
      body: [
        ['Yarn Compositions', this.sampleMaterial],
        ['Construction', this.sampleConstruction],
        ['Sample Sizes :', this.sampleSize],
        ['Finishing / Special Instruction :', this.sampleInstructions || 'N/A']
      ]
    });
    
    return doc.output('blob');
  }

  async submitSample() {
    if (!this.canSubmit()) return;
    this.isSubmitting = true;
    this.uploadProgress = 0;

    try {
      const generatedId = `MANUAL-${Date.now()}`;
      const fileKeys = Object.keys(this.selectedFiles);
      const uploadedUrls: { key: string, url: string, uploaded_at: number }[] = [];
      let totalSize = 0;
      for (const k of fileKeys) totalSize += this.selectedFiles[k].size;
      let uploadedSize = 0;

      const { storage } = await import('../../firebase.config');

      const sanitizedProject = this.projectName.replace(/[^a-z0-9]/gi, '_');

      for (const key of fileKeys) {
        const file = this.selectedFiles[key];
        const storagePath = `manual_samples/${sanitizedProject}/${generatedId}/${file.name}`;
        const storageRef = ref(storage, storagePath);
        
        const uploadTask = uploadBytesResumable(storageRef, file);
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              this.uploadProgress = Math.round(((uploadedSize + snapshot.bytesTransferred) / totalSize) * 80);
            },
            (error) => reject(error),
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              uploadedUrls.push({ key, url: downloadURL, uploaded_at: Date.now() });
              uploadedSize += file.size;
              resolve();
            }
          );
        });
      }

      this.uploadProgress = 85;

      const pdfBlob = await this.generatePDF(generatedId);
      const pdfName = `${generatedId}_RequestForm.pdf`;
      const pdfStorageRef = ref(storage, `manual_samples/${pdfName}`);
      await uploadBytes(pdfStorageRef, pdfBlob);
      const pdfLinkUrl = await getDownloadURL(pdfStorageRef);
      
      this.uploadProgress = 95;

      const newSample: Omit<Sample, 'id'> = {
        carpet_fk: generatedId,
        sample_type: this.sampleConstruction,
        status: 'Pending',
        sample_size: this.sampleSize,
        sample_material: this.sampleMaterial,
        sample_construction: this.sampleConstruction,
        sample_instructions: this.sampleInstructions,
        is_manual: true,
        client_name: this.clientName,
        project_name: this.projectName,
        designer_name: this.currentUser?.name || 'Unknown',
        file_uploads: uploadedUrls,
        pdf_url: pdfLinkUrl
      };

      await this.sampleService.addSample(newSample);
      this.uploadProgress = 100;

      this.clientName = '';
      this.projectName = '';
      this.sampleSize = '';
      this.sampleMaterial = '';
      this.sampleConstruction = '';
      this.sampleInstructions = '';
      this.selectedFiles = {};
      this.isSubmitting = false;
      
      alert('Sample Request successfully sent to Production!');
    } catch (e: any) {
      console.error('Manual upload failed', e);
      let errorMsg = e.error?.error?.message || e.error?.message || e.message || 'Unknown error';
      alert(`Manual sample request failed. Reason: ${errorMsg}\nPlease try again.`);
      this.isSubmitting = false;
    }
  }

  isNewFile(uploadedAt: number): boolean {
    const fortyEightHoursMs = 48 * 60 * 60 * 1000;
    return (Date.now() - uploadedAt) < fortyEightHoursMs;
  }
}
