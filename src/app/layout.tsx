import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import Providers from './components/Providers';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'The Golden Fork Employee Management',
  description: 'Manage employees, leads, and salaries.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans overflow-x-hidden w-full", geist.variable)}>
      <body className={cn(inter.className, "overflow-x-hidden w-full")}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}


