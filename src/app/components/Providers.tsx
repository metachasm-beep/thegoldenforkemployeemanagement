'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Toaster position="bottom-right" toastOptions={{ 
          className: 'dark:bg-gray-800 dark:text-white',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }} />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}


