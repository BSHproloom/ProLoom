import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SampleService, Sample } from 'shared-core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule],
  templateUrl: './production.html',
  styleUrl: './production.css',
})
export class Production implements OnInit {
  private sampleService = inject(SampleService);

  samples: Sample[] = [];
  displayedColumns: string[] = ['id', 'carpet_fk', 'sample_type', 'completion_date', 'status'];

  ngOnInit() {
    this.sampleService.getSamples().subscribe(s => {
      this.samples = s;
    });
  }
}
