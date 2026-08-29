export type EmployeeRole = 'Manager' | 'Team Lead' | 'Sales Executive';

export type Employee = {
  id: string;
  name: string;
  role: EmployeeRole;
  email: string;
  startDate: string;
  baseSalary: number;
  commissionRate: number;
  target: number;
  probationDuration: number;
  managerId?: string;
};

export type Lead = {
  leadId: string;
  employeeId: string;
  date: string;
  status: string; // 'Contacted' | 'Meeting Scheduled' | 'Proposal Sent' | 'Converted' | 'Lost'
  notes?: string;
  followUp?: string;
  assignee?: string;
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
  baseSalary: number;
  conversions: number;
  commission: number;
  leadershipBonus: number;
  performanceBonus: number;
  totalPayout: number;
  target: number;
  willTerminate: boolean;
};
