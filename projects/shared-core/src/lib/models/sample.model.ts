export interface Sample {
  id: string;
  carpet_fk: string;
  sample_type: string; // Knitdown, Pom box, etc.
  status: string; // 'Pending', 'In Progress', 'Revision Requested', 'Approved'
  sample_size?: string;
  sample_material?: string;
  sample_construction?: string;
  sample_instructions?: string;
  completion_date?: string;

  // Manual Sample Fields
  is_manual?: boolean;
  client_name?: string;
  project_name?: string;
  designer_name?: string;
  files?: { [key: string]: string }; // Map of filename to URL (same format as carpet files)
  file_uploads?: { key: string, url: string, uploaded_at: number }[]; // Array for tracking highlight dates
  pdf_url?: string;
}
