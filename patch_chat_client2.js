const fs = require('fs');
let code = fs.readFileSync('src/app/chat/ChatClient.tsx', 'utf8');

// Fix chat header
code = code.replace(
  '<h3 className="font-bold text-gray-900 dark:text-gray-100">{otherParticipant?.name || \'Chat\'}</h3>',
  '<h3 className="font-bold text-gray-900 dark:text-gray-100">{activeConvoDetails?.type === \'GROUP\' ? activeConvoDetails.name : (otherParticipant?.name || \'Chat\')}</h3>'
);

code = code.replace(
  '{otherParticipant && (',
  '{(otherParticipant || activeConvoDetails?.type === \'GROUP\') && ('
);

code = code.replace(
  '<Image src={avatarSrc} alt={otherParticipant.name} fill className="object-cover" />',
  '<Image src={activeConvoDetails?.type === \'GROUP\' ? \'https://ui-avatars.com/api/?name=Group&background=random\' : (otherParticipant?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.name || \'Chat\')}&background=random`)} alt="Avatar" fill className="object-cover" />'
);

// Fix message avatars
code = code.replace(
  '{showAvatar && !isMe && <span className="text-xs text-gray-500 mb-1 ml-1">{displayTitle}</span>}',
  '{showAvatar && !isMe && <span className="text-xs text-gray-500 mb-1 ml-1">{msg.sender?.name}</span>}'
);

fs.writeFileSync('src/app/chat/ChatClient.tsx', code);
console.log("Patched header and avatars in ChatClient.tsx");
