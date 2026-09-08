import fs from 'fs';

const content = fs.readFileSync('src/app/chat/ChatClient.tsx', 'utf-8');
const deps = `
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Target } from 'lucide-react';
`;

// Add imports near the top
const newContent = content.replace(
  "import { Search, X, Reply, Smile, CheckCheck, Megaphone, Lock, TrendingUp, Users } from 'lucide-react';",
  "import { Search, X, Reply, Smile, CheckCheck, Megaphone, Lock, TrendingUp, Users, Target } from 'lucide-react';\nimport { motion, AnimatePresence } from 'framer-motion';\nimport { useVirtualizer } from '@tanstack/react-virtual';\nimport { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';"
);

fs.writeFileSync('src/app/chat/ChatClient.tsx', newContent);
console.log('Imports added');
