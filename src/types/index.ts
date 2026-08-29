export type Employee = {
  id: string;
  name: string;
  role: string;
  email: string;
  baseSalary: number;
  commissionRate: number;
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
  totalPayout: number;
};
