export interface User {
  id?: string;
  name: string;
  email: string;
  role: 'AM' | 'Designer' | 'Production' | 'Admin' | 'SuperAdmin' | 'SalesCoordinator';
  fcmTokens?: string[];
  password?: string;
  allowedTabs?: string[];
}
