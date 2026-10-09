export interface Project {
  id: string; // e.g., P-12601
  client_name: string;
  project_name: string;
  carpet_quality: string; // ht-450, 550, 650, 750, 850
  no_of_rugs: number;
  type_of_carpet: string; // WALL TO WALL, RUG, INSERT
  timeline_weeks: number;
  client_commitment_date: Date | any; // Firestore Timestamp
  client_expectation_date?: Date | any;
  skip_artwork: boolean;
  sales_order: string;
  sales_order_file?: string;
  po_file?: string;
  advance_payment?: number;
  resources_files?: string[];
  am: string; // Account Manager Name
  overall_status: string; // 'Active', 'On Hold', 'Completed'
  artwork_approval_deadline: Date | any; // Firestore Timestamp
  client_email?: string; // For automated Outlook emails
}
