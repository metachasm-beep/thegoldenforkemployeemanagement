import { SalaryReport } from '@/types';
import { Trophy, Medal, Flame } from 'lucide-react';
import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function LeaderboardWidget({ 
  report, 
  leaderboard, 
  blindMode 
}: { 
  report?: SalaryReport, 
  leaderboard: SalaryReport[], 
  blindMode: boolean 
}) {
  const topFive = useMemo(() => leaderboard.slice(0, 5), [leaderboard]);

  if (leaderboard.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Trophy className="text-amber-500" /> Leaderboard
        </h3>
        <p className="text-gray-500">No employees found in the system yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
      <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <Trophy className="text-amber-500" /> Leaderboard {blindMode && <span className="text-xs text-gray-400 ml-2" aria-label="Blind Mode Active">(Blind Mode Active)</span>}
      </h3>
      
      <div className="flex flex-col gap-4">
        {topFive.map((l, index) => {
          const isMe = report ? l.employeeId === report.employeeId : false;
          const isTopCloser = index === 0 && l.conversions > 0;
          const isOnFire = l.conversions >= (l.target || 5);

          return (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              key={l.employeeId} 
              className={`flex items-center gap-4 p-3 rounded-xl border relative overflow-hidden ${isMe ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/50' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${isMe ? 'bg-orange-500' : isTopCloser ? 'bg-amber-500' : 'bg-gray-400'}`}></div>
              
              {isTopCloser ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}><Medal className="text-amber-500" size={28} /></motion.div> : <div className="w-7 text-center font-bold text-gray-400">#{index + 1}</div>}
              
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
                  {isMe ? 'You' : l.employeeName}
                  {isOnFire && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}><Flame size={14} className="text-orange-500" aria-label="On Fire Badge" /></motion.div>}
                </p>
                <p className={`text-xs font-medium ${isMe ? 'text-orange-600 dark:text-orange-500' : 'text-gray-500'}`}>
                  {blindMode && !isMe ? (
                    <span aria-label="Hidden in blind mode">***</span>
                  ) : (
                    `${l.conversions} Conversions`
                  )}
                </p>
              </div>
              <img src={l.avatarUrl || `https://ui-avatars.com/api/?name=${l.employeeName}&background=random`} alt={l.employeeName} className="w-8 h-8 rounded-full object-cover" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
