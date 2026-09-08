export interface ChannelPolicyDef {
  name: string;
  isReadOnly: boolean;
  roles: string[];
}

export const GLOBAL_CHANNELS_POLICY: ChannelPolicyDef[] = [
  { name: '#company-announcements', isReadOnly: true, roles: ['Manager', 'HR', 'Team Lead', 'Sales Executive'] },
  { name: '#hr-private', isReadOnly: false, roles: ['HR'] },
  { name: '#leadership-strategy', isReadOnly: false, roles: ['Manager', 'Team Lead'] }
];

export const getTeamChannelName = (managerName: string) => `Team ${managerName}`;
