export interface ChannelPolicyDef {
  name: string;
  description: string;
  isReadOnly: boolean;
  isPrivateGovernance?: boolean;
  roles: string[];
}

export const GLOBAL_CHANNELS_POLICY: ChannelPolicyDef[] = [
  {
    name: '#company-announcements',
    description: 'Official Golden Fork company-wide broadcasts, policy updates, and milestones.',
    isReadOnly: true,
    roles: ['Manager', 'COO', 'HR', 'Team Lead', 'Sales Executive'],
  },
  {
    name: '#coo-governance',
    description: 'Private Founder & COO operational command feed: 5-Pillar work sessions, Monday 10 AM reports, and revenue ledger.',
    isReadOnly: false,
    isPrivateGovernance: true,
    roles: ['Manager', 'COO'],
  },
  {
    name: '#venue-onboarding',
    description: 'Live hospitality rollouts, 21-Day Free Trial tracking, and Golden Fork module setups (POS, PMS, BOM, GST).',
    isReadOnly: false,
    roles: ['Manager', 'COO', 'Team Lead', 'Sales Executive'],
  },
  {
    name: '#field-pipeline-feed',
    description: 'Real-time field sales activity, new lead alerts, COO demo QA verifications, and deal conversions.',
    isReadOnly: false,
    roles: ['Manager', 'COO', 'Team Lead', 'Sales Executive'],
  },
  {
    name: '#leadership-strategy',
    description: 'Executive, COO, and Team Lead commercial strategy and territory alignment.',
    isReadOnly: false,
    roles: ['Manager', 'COO', 'Team Lead'],
  },
  {
    name: '#approvals-finance',
    description: 'Field expense approvals, >₹10,000 Founder CapEx escalations, PTO requests, and invoice alerts.',
    isReadOnly: false,
    roles: ['Manager', 'COO', 'HR'],
  },
  {
    name: '#hr-private',
    description: 'Internal HR & Founder personnel administration channel.',
    isReadOnly: false,
    roles: ['Manager', 'HR'],
  },
];

export const getTeamChannelName = (managerName: string) => `Team ${managerName}`;
