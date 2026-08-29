export type Employee = {
  id: string;
  name: string;
  role: string;
  email: string;
  baseSalary: number;
  commissionRate: number; // Commission per conversion
};

export type Lead = {
  leadId: string;
  employeeId: string;
  date: string;
  status: 'Pending' | 'Converted';
};

export type SalaryReport = {
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  conversions: number;
  commission: number;
  totalPayout: number;
};
