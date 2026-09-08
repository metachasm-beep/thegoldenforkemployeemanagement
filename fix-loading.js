const fs = require('fs');
let code = fs.readFileSync('src/app/chat/ChatClient.tsx', 'utf8');

code = code.replace(/const \[inputText, setInputText\] = useState\(''\);/, "const [inputText, setInputText] = useState('');\n  const [isSending, setIsSending] = useState(false);");

code = code.replace(/setLoading\(true\);/g, "setIsSending(true);");
code = code.replace(/setLoading\(false\);/g, "setIsSending(false);");

fs.writeFileSync('src/app/chat/ChatClient.tsx', code);
