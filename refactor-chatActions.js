const fs = require('fs');
let code = fs.readFileSync('src/app/chatActions.ts', 'utf8');

// Add import
const importStat = "import { GLOBAL_CHANNELS_POLICY, getTeamChannelName } from '@/lib/policies/channelPolicy';";
if (!code.includes('GLOBAL_CHANNELS_POLICY')) {
  code = code.replace("import { pusherServer } from '@/lib/pusher';", "import { pusherServer } from '@/lib/pusher';\n" + importStat);
}

// Replace the channels block
const oldChannelsBlock = `  const channels = [
    { name: '#company-announcements', isReadOnly: true, roles: ['Manager', 'HR', 'Team Lead', 'Sales Executive'] },
    { name: '#hr-private', isReadOnly: false, roles: ['HR'] },
    { name: '#leadership-strategy', isReadOnly: false, roles: ['Manager', 'Team Lead'] }
  ];

  for (const ch of channels) {`;

const newChannelsBlock = `  for (const ch of GLOBAL_CHANNELS_POLICY) {`;

code = code.replace(oldChannelsBlock, newChannelsBlock);

// Replace teamName block
code = code.replace("const teamName = `Team ${managerEmp.name}`;", "const teamName = getTeamChannelName(managerEmp.name);");

fs.writeFileSync('src/app/chatActions.ts', code);
