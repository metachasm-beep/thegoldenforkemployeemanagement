import fs from 'fs';

let content = fs.readFileSync('src/app/chat/ChatClient.tsx', 'utf-8');

// 1. Add Imports
content = content.replace(
  "import { Search, X, Reply, Smile, CheckCheck, Megaphone, Lock, TrendingUp, Users } from 'lucide-react';",
  "import { Search, X, Reply, Smile, CheckCheck, Megaphone, Lock, TrendingUp, Users, Target } from 'lucide-react';\nimport { motion, AnimatePresence } from 'framer-motion';\nimport { useVirtualizer } from '@tanstack/react-virtual';\nimport { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';"
);

// 2. Add LeadCard and Markdown Components right above ChatClientSoft
const componentsBlock = `
const LeadCard = ({ id }: { id: string }) => (
  <motion.div whileHover={{ scale: 1.02 }} className="bg-white/90 dark:bg-gray-800/90 border border-purple-200 dark:border-purple-900 rounded-2xl p-4 my-2 flex items-center gap-4 backdrop-blur-md shadow-sm cursor-pointer w-full max-w-sm">
    <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-xl text-purple-600 dark:text-purple-400 shrink-0">
      <Target size={24} />
    </div>
    <div className="overflow-hidden">
      <div className="font-bold text-sm text-gray-900 dark:text-white truncate">Lead Ref: {id}</div>
      <div className="text-xs text-gray-500 truncate">Click to view details in CRM</div>
    </div>
  </motion.div>
);

const MarkdownComponents: any = {
  p: ({ children }: any) => {
    if (typeof children === 'string' && children.trim().startsWith('[LEAD:') && children.trim().endsWith(']')) {
      const leadId = children.replace('[LEAD:', '').replace(']', '');
      return <LeadCard id={leadId} />;
    }
    return <p className="mb-2 last:mb-0 leading-relaxed tracking-tight">{children}</p>;
  },
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match && match[1] === 'json') {
      try {
        const data = JSON.parse(String(children).replace(/\\n$/, ''));
        if (data.type === 'chart') {
          return (
            <div className="h-48 w-full bg-white dark:bg-gray-950 p-4 rounded-2xl my-3 border border-gray-100 dark:border-gray-800 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.data}>
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                  <Bar dataKey="value" fill="#c084fc" radius={[4,4,4,4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        }
      } catch (e) {}
    }
    return <code className={className} {...props}>{children}</code>;
  }
};
`;
content = content.replace('export default function ChatClientSoft', componentsBlock + '\nexport default function ChatClientSoft');

fs.writeFileSync('src/app/chat/ChatClient.tsx', content);
console.log('Phase 1 done');
