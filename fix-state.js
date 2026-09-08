const fs = require('fs');
let code = fs.readFileSync('src/app/chat/ChatClient.tsx', 'utf8');

// Replace state
code = code.replace(/const \[activeConversationId, setActiveConversationId\] = useState<string \| null>\(null\);\s*const \[messages, setMessages\] = useState<any\[\]>\(\[\]\);\s*const \[inputText, setInputText\] = useState\(''\);\s*const \[loading, setLoading\] = useState\(false\);/, 
`const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  
  const { messages, setMessages, presence, loading } = useChatSync(
    currentEmployeeId, 
    activeConversationId, 
    isImpersonating, 
    setConversations
  );`);

// Fix missing imports across the codebase
const filesToFix = ['src/app/components/LeadsKanban.tsx', 'src/app/chat/ChatClient.tsx'];
filesToFix.forEach(f => {
    if (fs.existsSync(f)) {
        let content = fs.readFileSync(f, 'utf8');
        content = content.replace(/@\/components\/ui\/label/g, '@/components/ui/primitives');
        content = content.replace(/@\/components\/ui\/separator/g, '@/components/ui/primitives');
        content = content.replace(/@\/components\/ui\/skeleton/g, '@/components/ui/primitives');
        fs.writeFileSync(f, content);
    }
});

fs.writeFileSync('src/app/chat/ChatClient.tsx', code);
