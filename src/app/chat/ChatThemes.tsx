'use client';
import { useState } from 'react';
import ChatClientCorporate from './ChatClientCorporate';
import ChatClientMinimalist from './ChatClientMinimalist';
import ChatClientBrutalist from './ChatClientBrutalist';
import ChatClientSoft from './ChatClientSoft';
import ChatClientHacker from './ChatClientHacker';

export default function ChatThemes(props: any) {
  const [theme, setTheme] = useState('corporate');

  const themes = [
    { id: 'corporate', name: 'Corporate SaaS' },
    { id: 'minimalist', name: 'Minimalist' },
    { id: 'brutalist', name: 'Neo-Brutalist' },
    { id: 'soft', name: 'Soft Glassmorphism' },
    { id: 'hacker', name: 'Terminal Hacker' },
  ];

  const renderClient = () => {
    switch (theme) {
      case 'minimalist': return <ChatClientMinimalist {...props} />;
      case 'brutalist': return <ChatClientBrutalist {...props} />;
      case 'soft': return <ChatClientSoft {...props} />;
      case 'hacker': return <ChatClientHacker {...props} />;
      case 'corporate': 
      default: return <ChatClientCorporate {...props} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto border border-gray-200 dark:border-gray-700">
        {themes.map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${theme === t.id ? 'bg-amber-500 text-white shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="relative">
        {renderClient()}
      </div>
    </div>
  );
}
