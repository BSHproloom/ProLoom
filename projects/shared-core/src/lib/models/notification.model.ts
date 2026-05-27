export interface Notification {
  id?: string;
  recipient_email: string;
  recipient_role?: string;
  message: string;
  read_status: boolean;
  timestamp: Date | any;
  link_url?: string;
}
