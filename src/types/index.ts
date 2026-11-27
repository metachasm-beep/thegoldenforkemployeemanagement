export type EmployeeRole =
  | 'Manager'
  | 'COO'
  | 'Team Lead'
  | 'Sales Executive'
  | 'Part-Time Sales Executive'
  | 'Closer'
  | 'HR';

export type Employee = {
  id: string;
  name: string;
  role: string;
  email: string;
  startDate?: string;
  baseSalary: number;
  probationSalary?: number;
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
  lastLogin?: string | null;
  customFields?: Record<string, any>;
};

export type CustomFieldDefinition = {
  id: string;
  entityType: 'LEAD' | 'EMPLOYEE';
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string | null;
  required: boolean;
};

export type Lead = {
  leadId: string;
  employeeId: string;
  closerId?: string | null;
  date: string;
  status: string;
  name: string;
  email: string | null;
  phone: string | null;
  linkedIn: string | null;
  objections: string | null;
  nextAction: string | null;
  followUp: string;
  notes: string;
  createdAt: Date;
  convertedAt?: Date;
  customFields?: Record<string, any>;
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
  role?: string;
  isPartTime?: boolean;
  isCloser?: boolean;
  closerIncentivePercent?: number;
  isProbationPeriod?: boolean;
  probationDuration?: number;
  avatarUrl?: string | null;
  target: number;
  conversions: number;
  leads: number;
  verifiedDemos?: number;
  demoQuota?: number;
  netRevenueThisMonth?: number;
  netRevenueQuota?: number;
  cumulativeNetRevenue?: number;
  tierStatusLabel?: string;
  baseSalary: number;
  commission: number;
  grossPayout: number;
  tdsDeduction: number;
  totalPayout: number;
  panNumber?: string | null;
  aadhaarNumber?: string | null;
  invoiceId?: string | null;
  willTerminate?: boolean;
};

export type CloserDisposition =
  | 'UNWORKED'
  | 'CALL_ATTEMPTED'
  | 'CONNECTED'
  | 'DEMO_SCHEDULED'
  | 'PROPOSAL_SENT'
  | 'FOLLOW_UP'
  | 'PENDING_VERIFICATION'
  | 'CLOSED_WON'
  | 'CLOSED_LOST'
  | 'UNRESPONSIVE'
  | 'RECYCLED';

export type CloserLeadAssignmentRecord = {
  id: string;
  leadId: string;
  closerId: string;
  assignedById: string;
  batchDate: string; // YYYY-MM-DD IST
  slotNumber: number;
  cooBriefingNote?: string | null;
  disposition: CloserDisposition | string;
  callAttempts: number;
  closerNotes: string;
  nextFollowUpDate?: string | null;
  assignedAt: string;
  firstTouchedAt?: string | null;
  lastWorkedAt?: string | null;
  closedAt?: string | null;
  isRecycled: boolean;
};

export type CloserCooRating = 'EXCEEDS' | 'MEETS' | 'NEEDS_COACHING';

export type CloserDailyReportRecord = {
  id: string;
  closerId: string;
  reportDate: string; // YYYY-MM-DD IST
  deadlineAt: string;
  submittedAt: string;
  isOnTime: boolean;
  assignedCount: number;
  workedCount: number;
  unworkedCount: number;
  connectedCount: number;
  demosCount: number;
  proposalsSentCount: number;
  sentForVerificationCount: number;
  closedWonCount: number;
  lostCount: number;
  netRevenueClosed: number;
  winsSummary: string;
  topObjections: string;
  tomorrowHotClosures: string;
  supportNeededFromCoo: string;
  cooReviewed: boolean;
  cooReviewedById?: string | null;
  cooReviewedAt?: string | null;
  cooRating?: CloserCooRating | string | null;
  cooFeedback?: string | null;
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
