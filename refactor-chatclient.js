const fs = require('fs');
let code = fs.readFileSync('src/app/chat/ChatClient.tsx', 'utf8');

// 1. Add import
if (!code.includes('useChatSync')) {
  code = code.replace("import { getPusherClient } from '@/lib/pusher';", "import { getPusherClient } from '@/lib/pusher';\nimport { useChatSync } from '@/hooks/useChatSync';");
}

// 2. Remove the old states and hooks
const oldStateBlock = `  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);`;

const newStateBlock = `  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  
  const { messages, setMessages, presence, loading } = useChatSync(
    currentEmployeeId, 
    activeConversationId, 
    isImpersonating, 
    setConversations
  );`;

code = code.replace(oldStateBlock, newStateBlock);

// Remove the `const [presence, setPresence] = useState<Record<string, 'online' | 'away' | 'offline'>>({});` line
code = code.replace(/const \[presence, setPresence\] = useState<Record<string, 'online' \| 'away' \| 'offline'>>\(\{\}\);\s*/g, '');

// Remove the two massive useEffects
const useEffectRegex = /  useEffect\(\(\) => \{\s*const pusher = getPusherClient\(\);\s*const globalChannel = pusher\.subscribe\('presence-global'\);[\s\S]*?\}, \[activeConversationId, isImpersonating, currentEmployeeId\]\);/g;

code = code.replace(useEffectRegex, '');

fs.writeFileSync('src/app/chat/ChatClient.tsx', code);
