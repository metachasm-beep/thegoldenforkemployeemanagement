export type EmployeeRole = 'Manager' | 'Team Lead' | 'Sales Executive';

export type Employee = {
  id: string;
  name: string;
  role: string;
  email: string;
  startDate?: string;
  baseSalary: number;
  commissionRate: number;
  target: number;
  managerId?: string;
  probationDuration: number;
  isProbation: boolean;
  failedMonths: number;
  penalty: number;
  sessionVersion: number;
  avatarUrl?: string | null;
  panNumber?: string | null;
  aadhaarNumber?: string | null;
};

export type Lead = {
  leadId: string;
  employeeId: string;
  date: string;
  status: string;
  assignee: string;
  followUp: string;
  notes: string;
  createdAt: Date;
  convertedAt?: Date;
};

export type Expense = {
  expenseId: string;
  employeeId: string;
  date: string;
  amount: number;
  description: string;
  status: string;
};

export type PTO = {
  ptoId: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  status: string;
};

export type SalaryReport = {
  employeeId: string;
  employeeName: string;
  avatarUrl?: string | null;
  target: number;
  conversions: number;
  baseSalary: number;
  commission: number;
  totalPayout: number;
  panNumber?: string | null;
  aadhaarNumber?: string | null;
  invoiceLink?: string | null;
};

export type AuditLog = {
  id: string;
  employeeId: string;
  action: string;
  details: string;
  timestamp: Date;
};

export type Notification = {
  id: string;
  recipientId: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: Date;
};
