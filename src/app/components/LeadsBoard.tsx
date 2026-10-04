'use client';

import { Lead, Employee, CustomFieldDefinition } from '@/types';
import { useState, useMemo, useEffect } from 'react';
import { Search, LayoutList, Calendar as CalendarIcon, Table as TableIcon, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LeadsKanban from './LeadsKanban';
import LeadsCalendar from './LeadsCalendar';
import LeadsTable from './LeadsTable';

type Props = {
  initialLeads: Lead[];
  employees: Employee[];
  isManager?: boolean;
  customFieldDefs?: CustomFieldDefinition[];
};

export default function LeadsBoard({ initialLeads, employees, isManager = false, customFieldDefs = [] }: Props) {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredLeads = useMemo(() => {
    return initialLeads.filter(l => {
      const matchesSearch = l.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           l.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEmployee = selectedEmployee === 'all' || l.employeeId === selectedEmployee;
      return matchesSearch && matchesEmployee;
    });
  }, [initialLeads, searchQuery, selectedEmployee]);

  if (!mounted) return <div className="h-[600px] flex items-center justify-center text-gray-500">Loading Board...</div>;

  return (
    <div className="space-y-6">
      {/* Global Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 spatial-card p-4 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search leads..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-64 spatial-card border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white"
            />
          </div>
          {isManager && (
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-full sm:w-[200px] spatial-card border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="All Members" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl z-50">
                <SelectItem value="all">All Members</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        {/* View Toggles */}
        <div className="flex items-center p-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            <LayoutList className="w-4 h-4" />
            <span className="hidden sm:inline">Kanban</span>
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Calendar</span>
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            <TableIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {viewMode === 'kanban' && (
        <LeadsKanban leads={filteredLeads} employees={employees} customFieldDefs={customFieldDefs} isManager={isManager} />
      )}
      {viewMode === 'calendar' && (
        <LeadsCalendar leads={filteredLeads} employees={employees} customFieldDefs={customFieldDefs} isManager={isManager} />
      )}
      {viewMode === 'table' && (
        <LeadsTable leads={filteredLeads} employees={employees} customFieldDefs={customFieldDefs} isManager={isManager} />
      )}
    </div>
  );
}
