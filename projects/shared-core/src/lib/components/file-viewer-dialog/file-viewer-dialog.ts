import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface FileViewerData {
  files: { [key: string]: string };
  remark?: string;
}

@Component({
  selector: 'app-file-viewer-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  templateUrl: './file-viewer-dialog.html',
  styleUrls: ['./file-viewer-dialog.css']
})
export class FileViewerDialogComponent {
  
  fileEntries: { key: string, url: string }[] = [];
  selectedFile: { key: string, url: string } | null = null;
  safeUrl: SafeResourceUrl | null = null;
  isOneDriveLink = false;

  constructor(
    public dialogRef: MatDialogRef<FileViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FileViewerData,
    private sanitizer: DomSanitizer
  ) {
    if (this.data && this.data.files) {
      this.fileEntries = Object.keys(this.data.files).map(key => ({
        key,
        url: this.data.files[key]
      }));
      
      if (this.fileEntries.length > 0) {
        this.selectFile(this.fileEntries[0]);
      }
    }
  }

  selectFile(file: { key: string, url: string }) {
    this.selectedFile = file;
    this.isOneDriveLink = file.url.includes('sharepoint.com') || file.url.includes('1drv.ms') || file.url.includes('microsoft.com');
    // Bypass security to load the URL in iframe
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(file.url);
  }

  close() {
    this.dialogRef.close();
  }

  formatFileName(key: string): string {
    // Convert keys like 'sample_taken_area' to 'Sample Taken Area'
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  getFileIcon(key: string): string {
    if (key.includes('image') || key.includes('area') || key.includes('photo')) return 'image';
    if (key.includes('technology') || key.includes('tech')) return 'description';
    return 'insert_drive_file';
  }
}
