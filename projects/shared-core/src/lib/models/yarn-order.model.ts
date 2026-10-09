export interface YarnOrderRequest {
  id?: string;
  project_id: string;
  carpet_id: string;
  color_code: string;
  quantity_kg: number;
  purpose: 'Sample' | 'Production';
  status: 'Pending' | 'Ordered' | 'Arrived';
  requested_by: string;
  requested_at: Date | any;
  notes?: string;
}
