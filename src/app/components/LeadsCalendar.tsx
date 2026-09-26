'use client';

import { Lead, Employee, CustomFieldDefinition } from '@/types';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EditLeadModal from './EditLeadModal';

type Props = {
  leads: Lead[];
  employees: Employee[];
  customFieldDefs?: CustomFieldDefinition[];
};

export default function LeadsCalendar({ leads, employees, customFieldDefs = [] }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modals
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startPadding = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Padding before
    for (let i = 0; i < startPadding; i++) {
      days.push({ day: null, dateStr: null, leads: [] });
    }
    
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      // Format YYYY-MM-DD
      const dateStr = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0')
      ].join('-');
      
      const dayLeads = leads.filter(l => l.followUp === dateStr);
      days.push({ day: i, dateStr, leads: dayLeads });
    }
    
    return days;
  }, [currentDate, leads]);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const today = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button onClick={today} className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">Today</button>
          <button onClick={prevMonth} className="p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
          <button onClick={nextMonth} className="p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-50 dark:bg-gray-900/50 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
        
        {calendarDays.map((cell, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-900 min-h-[120px] p-2 flex flex-col transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
            {cell.day && (
              <>
                <span className={`text-sm font-medium mb-1 ${cell.dateStr === new Date().toISOString().split('T')[0] ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700 dark:text-gray-300'}`}>
                  {cell.day}
                </span>
                <div className="flex flex-col gap-1 overflow-y-auto hide-scrollbar flex-1">
                  {cell.leads.map(lead => (
                    <button 
                      key={lead.leadId}
                      onClick={() => { setSelectedLead(lead); setIsSheetOpen(true); }}
                      className="text-left text-xs px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 rounded truncate hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      {lead.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <EditLeadModal 
        selectedLead={selectedLead}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        employees={employees}
        customFieldDefs={customFieldDefs}
      />
    </div>
  );
}
