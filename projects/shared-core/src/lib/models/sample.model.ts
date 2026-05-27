export interface Sample {
  id: string;
  carpet_fk: string;
  sample_type: string; // Knitdown, Pom box, etc.
  status: string; // 'Pending', 'In Progress', 'Revision Requested', 'Approved'
}
