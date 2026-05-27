export interface ActivityLog {
  id?: string;
  carpet_id: string;
  project_id: string;
  user_name: string;
  action: 'Assigned' | 'Started' | 'Paused' | 'Submitted for Review' | 'Revision Requested' | 'Approved' | 'Sent to AM';
  comment: string;
  time_spent_seconds?: number;
  timestamp: Date | any;
}
