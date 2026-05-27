import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Sample } from 'shared-core';

// jsPDF will be used later as per plan "stubbed until the template is provided"

const MOCK_SAMPLES: Sample[] = [
  { id: 'SMP-1001', carpet_fk: 'SKU-001', sample_type: 'Knitdown', status: 'In Progress' },
  { id: 'SMP-1002', carpet_fk: 'SKU-001', sample_type: 'Pom box', status: 'Pending' },
  { id: 'SMP-1003', carpet_fk: 'SKU-002', sample_type: 'Knitdown', status: 'Approved' }
];

@Component({
  selector: 'app-samples',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule],
  templateUrl: './samples.html',
  styleUrl: './samples.css',
})
export class Samples {
  displayedColumns: string[] = ['id', 'carpet_fk', 'sample_type', 'status', 'actions'];
  dataSource = MOCK_SAMPLES;

  generatePDF(sample: Sample) {
    // Stub for PDF generation
    alert(`Generating PDF for ${sample.id}... (Template pending)`);
  }
}
