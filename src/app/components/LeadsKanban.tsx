'use client';

import { Lead, Employee } from '@/types';
import { updateLead } from '../actions';
import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Search, LayoutList, LayoutGrid, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import CompanyLogo from './CompanyLogo';

type Props = {
  leads: Lead[];
  employees: Employee[];
  isManager?: boolean;
};

// Using actual statuses based on recent DB schema
const STAGES = ['Lead Captured', 'Proposal Sent', 'Pending Verification', 'Converted', 'Lost'];

export default function LeadsKanban({ leads: initialLeads, employees, isManager = false }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  
  // Smart Control States
  const [isCompact, setIsCompact] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');

  // Mobile Redesign States
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileStage, setActiveMobileStage] = useState(STAGES[0]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getEmployeeName = (id: string) => {
    return employees.find(e => e.id === id)?.name || 'Unknown Agent';
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        (lead.assignee?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (lead.notes?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesEmployee = selectedEmployee === 'all' || lead.employeeId === selectedEmployee;
      
      return matchesSearch && matchesEmployee;
    });
  }, [leads, searchQuery, selectedEmployee]);

  const handleMobileStageChange = async (leadId: string, newStatus: string) => {
    const leadToUpdate = leads.find(l => l.leadId === leadId);
    if (!leadToUpdate || leadToUpdate.status === newStatus) return;

    // Optimistic update
    setLeads(prev => prev.map(l => l.leadId === leadId ? { ...l, status: newStatus } : l));
    setIsSheetOpen(false);
    
    if (newStatus === 'Converted') {
      confetti({
         particleCount: 100,
         spread: 70,
         origin: { y: 0.6 },
         colors: ['#10B981', '#34D399', '#059669']
      });
      toast.success('Awesome job! Sales conversion logged.', { icon: '🎉' });
    } else {
      toast.success(`Lead moved to ${newStatus}`);
    }

    try {
      await updateLead(leadId, { status: newStatus });
    } catch (error) {
      toast.error('Failed to update lead');
      setLeads(initialLeads); // Revert on failure
    }
  };

  const handleCardClick = (lead: Lead) => {
    if (isMobile) {
      setSelectedLead(lead);
      setIsSheetOpen(true);
    }
  };

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    
    // Optimistic update
    setLeads(prev => prev.map(l => l.leadId === draggableId ? { ...l, status: newStatus } : l));
    
    if (newStatus === 'Converted') {
      confetti({
         particleCount: 100,
         spread: 70,
         origin: { y: 0.6 },
         colors: ['#10B981', '#34D399', '#059669']
      });
      toast.success('Awesome job! Sales conversion logged.', { icon: '🎉' });
    }

    await updateLead(draggableId, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Smart Pipeline Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex-1 w-full flex items-center relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 text-gray-400" />
          <Input 
            placeholder="Search leads or notes..." 
            className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-6 w-full sm:w-auto">
          {isManager && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 h-9">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2 border-l pl-6 border-gray-200 dark:border-gray-700">
            <LayoutList className={`w-4 h-4 ${!isCompact ? 'text-indigo-600' : 'text-gray-400'}`} />
            <Switch 
              id="compact-mode" 
              checked={isCompact} 
              onCheckedChange={setIsCompact} 
            />
            <LayoutGrid className={`w-4 h-4 ${isCompact ? 'text-indigo-600' : 'text-gray-400'}`} />
            <Label htmlFor="compact-mode" className="sr-only">Compact Mode</Label>
          </div>
        </div>
      </div>

      {/* Mobile Swipeable Tabs */}
      <div className="md:hidden flex overflow-x-auto gap-2 pb-2 mb-2 scrollbar-hide">
        {STAGES.map(stage => {
          const count = filteredLeads.filter(l => (l.status || 'Lead Captured') === stage).length;
          return (
            <button
              key={stage}
              onClick={() => setActiveMobileStage(stage)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors flex items-center gap-2 ${
                activeMobileStage === stage 
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {stage}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeMobileStage === stage 
                  ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 pb-4">
          {STAGES.map(stage => {
            const stageLeads = filteredLeads.filter(l => (l.status || 'Lead Captured') === stage);
            
            return (
              <Droppable key={stage} droppableId={stage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-2xl border p-4 flex-col transition-colors h-[600px] ${
                      activeMobileStage === stage ? 'flex' : 'hidden md:flex'
                    } ${
                      snapshot.isDraggingOver 
                        ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                        : 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex justify-between items-center px-1">
                      {stage}
                      <span className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-2.5 py-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 tabular-nums">
                        {stageLeads.length}
                      </span>
                    </h3>
                    
                    <div className="flex-1 space-y-3 overflow-y-auto pr-1 pb-4">
                      {stageLeads.map((lead, index) => (
                        <Draggable key={lead.leadId} draggableId={lead.leadId} index={index} isDragDisabled={isMobile}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => handleCardClick(lead)}
                              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all ${
                                snapshot.isDragging 
                                  ? 'shadow-xl border-blue-300 dark:border-blue-700 rotate-2 cursor-grabbing z-50' 
                                  : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 cursor-grab'
                              } ${isCompact ? 'p-3' : 'p-4'}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2 max-w-[80%] overflow-hidden">
                                  <CompanyLogo name={lead.assignee} size={isCompact ? 20 : 28} />
                                  <p className={`font-bold text-gray-900 dark:text-gray-100 ${isCompact ? 'text-xs truncate' : 'text-sm truncate'}`}>
                                    {lead.assignee || 'Unnamed Lead'}
                                  </p>
                                </div>
                                {!isCompact && stage === 'Converted' && <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full shrink-0">WON</span>}
                                {!isCompact && stage === 'Lost' && <span className="text-red-600 dark:text-red-400 text-[10px] font-bold bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full shrink-0">LOST</span>}
                                {isCompact && stage === 'Converted' && <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />}
                                {isCompact && stage === 'Lost' && <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1" />}
                              </div>
                              
                              <p className={`text-gray-500 dark:text-gray-400 ${isCompact ? 'text-[10px] truncate' : 'text-xs mb-3'}`}>
                                {getEmployeeName(lead.employeeId)}
                              </p>
                              
                              {!isCompact && lead.notes && (
                                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 italic border-l-2 border-indigo-200 dark:border-indigo-800 pl-2 mb-3">
                                  "{lead.notes}"
                                </p>
                              )}
                              
                              {!isCompact && (
                                <div className="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-gray-800/50">
                                  <span className="text-[10px] text-gray-400 font-medium">{lead.date}</span>
                                  {lead.followUp && (
                                    <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md font-medium">
                                      Follow-up: {lead.followUp}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {stageLeads.length === 0 && !snapshot.isDraggingOver && (
                        <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                          <span className="text-sm text-gray-400 dark:text-gray-600 font-medium">Drop here</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-10 max-h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left text-xl">Move Lead</SheetTitle>
            <p className="text-left text-sm text-gray-500">{selectedLead?.assignee || 'Unnamed'}</p>
          </SheetHeader>
          <div className="flex flex-col gap-3">
            {STAGES.map(stage => (
              <button
                key={stage}
                onClick={() => handleMobileStageChange(selectedLead!.leadId, stage)}
                className={`px-5 py-4 rounded-xl text-left font-bold transition-colors flex items-center justify-between ${
                  selectedLead?.status === stage 
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-2 border-amber-200 dark:border-amber-800/50' 
                    : 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {stage}
                {selectedLead?.status === stage && <span className="text-xs uppercase tracking-wider">Current</span>}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
