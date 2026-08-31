'use client';

import { SalaryReport } from '@/types';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EarningsCard from './EarningsCard';

export default function EmployeeDashboard({ 
  report, 
  settings
}: { 
  report: SalaryReport | undefined, 
  settings: Record<string, string>
}) {
  if (!report) return (
    <div className="bg-red-50 p-4 md:p-6 rounded-xl border border-red-100 text-red-600 font-medium flex items-center gap-2">
      <AlertCircle /> No compensation data found for your account.
    </div>
  );

  const broadcast = settings['BroadcastMessage'];

  return (
    <div className="space-y-6">
      
      {/* System Broadcast Marquee */}
      <AnimatePresence>
        {broadcast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-500 py-3 px-6 rounded-2xl flex items-center gap-4 overflow-hidden border border-amber-200 dark:border-amber-900/50"
            role="alert"
          >
            <AlertCircle size={20} className="flex-shrink-0 animate-pulse" />
            <div className="font-semibold text-sm tracking-wide animate-pulse">{broadcast}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto md:p-6">
        <EarningsCard report={report} />
      </div>
    </div>
  );
}
