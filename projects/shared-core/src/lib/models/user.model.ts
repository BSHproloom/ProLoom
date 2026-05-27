export interface User {
  id?: string;
  name: string;
  email: string;
  role: 'AM' | 'Designer' | 'Production' | 'Admin';
}
