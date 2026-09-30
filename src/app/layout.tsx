import type { Metadata } from 'next';
import { Inter, Merriweather, Lexend, Fira_Code, Space_Grotesk } from 'next/font/google';
import './globals.css';
import Providers from './components/Providers';
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const merriweather = Merriweather({ weight: ['300', '400', '700', '900'], subsets: ['latin'], variable: '--font-serif' });
const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-mono' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-geometric' });

export const metadata: Metadata = {
  title: 'The Golden Fork CRM',
  description: 'Manage employees, leads, and salaries.',
  manifest: '/manifest.json',
  themeColor: '#4f46e5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(
      inter.variable, 
      merriweather.variable, 
      lexend.variable, 
      firaCode.variable,
      spaceGrotesk.variable
    )}>
      <body className="font-sans antialiased text-gray-900 bg-gray-50 dark:bg-slate-950 dark:text-gray-100">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
