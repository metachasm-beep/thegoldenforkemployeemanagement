'use client';

import { Lead, Employee } from '@/types';
import { updateLead, deleteLead } from '../actions';
import { useState, useEffect, useMemo, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Search, LayoutList, LayoutGrid, User, Trash2 } from 'lucide-react';
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
import SubmitButton from './SubmitButton';

type Props = {
  leads: Lead[];
  employees: Employee[];
  isManager?: boolean;
};

const STAGES = ['Lead Captured', 'Proposal Sent', 'Pending Verification', 'Converted', 'Lost'];

export default function LeadsKanban({ leads: initialLeads, employees, isManager = false }: Props) {
  const [mounted, setMounted] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  
  const [isCompact, setIsCompact] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');

  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileStage, setActiveMobileStage] = useState(STAGES[0]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = l.assignee?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           l.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEmployee = selectedEmployee === 'all' || l.employeeId === selectedEmployee;
      return matchesSearch && matchesEmployee;
    });
  }, [leads, searchQuery, selectedEmployee]);

  const getEmployeeName = (id: string) => {
    return employees.find(e => e.id === id)?.name || 'Unknown';
  };

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
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

    const res = await updateLead(draggableId, { status: newStatus });
    if (!res?.success) {
      toast.error('Failed to move lead');
      setLeads(initialLeads); // Revert
    }
  };

  const handleEditSubmit = async (formData: FormData) => {
    if (!selectedLead) return;
    const updates = {
      assignee: formData.get('assignee') as string,
      status: formData.get('status') as string,
      followUp: formData.get('followUp') as string,
      notes: formData.get('notes') as string,
    };
    
    const res = await updateLead(selectedLead.leadId, updates);
    if (res?.success) {
      toast.success('Lead updated successfully');
      setIsSheetOpen(false);
    } else {
      toast.error('Failed to update lead');
    }
  };

  const handleDelete = async () => {
    if (!selectedLead || !confirm('Are you sure you want to delete this lead?')) return;
    const res = await deleteLead(selectedLead.leadId);
    if (res?.success) {
      toast.success('Lead deleted');
      setIsSheetOpen(false);
    } else {
      toast.error(res?.error || 'Failed to delete lead');
    }
  };

  if (!mounted) return <div className="h-[600px] flex items-center justify-center text-gray-500">Loading Board...</div>;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search leads..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-64 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            />
          </div>
          {isManager && (
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-full sm:w-[200px] bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="All Members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2">
            <LayoutList className={`w-4 h-4 ${isCompact ? 'text-gray-400' : 'text-blue-500'}`} />
            <Switch 
              checked={isCompact} 
              onCheckedChange={setIsCompact}
              className="data-[state=checked]:bg-blue-500"
            />
            <LayoutGrid className={`w-4 h-4 ${isCompact ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
        </div>
      </div>

      {/* Mobile Stage Selector */}
      <div className="flex md:hidden overflow-x-auto pb-2 gap-2 snap-x hide-scrollbar">
        {STAGES.map(stage => {
          const count = filteredLeads.filter(l => (l.status || 'Lead Captured') === stage).length;
          return (
            <button
              key={stage}
              onClick={() => setActiveMobileStage(stage)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors flex items-center gap-2 snap-start ${
                activeMobileStage === stage 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {stage}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeMobileStage === stage 
                  ? 'bg-blue-500 text-white' 
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
                        <Draggable key={lead.leadId} draggableId={lead.leadId} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => handleCardClick(lead)}
                              style={{...provided.draggableProps.style}}
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

      {selectedLead && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-white dark:bg-gray-900">
            <SheetHeader className="mb-6 border-b pb-4 dark:border-gray-800">
              <SheetTitle className="text-xl font-bold">Edit Lead</SheetTitle>
              <p className="text-sm text-gray-500">Logged by {getEmployeeName(selectedLead.employeeId)} on {selectedLead.date}</p>
            </SheetHeader>
            <form action={handleEditSubmit} className="space-y-5">
              <div>
                <Label>Assignee / POC Name</Label>
                <Input name="assignee" defaultValue={selectedLead.assignee} className="mt-1" />
              </div>
              <div>
                <Label>Stage</Label>
                <select name="status" defaultValue={selectedLead.status} className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300">
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label>Follow-up Date</Label>
                <Input type="date" name="followUp" defaultValue={selectedLead.followUp} className="mt-1" />
              </div>
              <div>
                <Label>Notes</Label>
                <textarea 
                  name="notes" 
                  defaultValue={selectedLead.notes} 
                  className="mt-1 flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                />
              </div>
              
              <div className="pt-6 flex flex-col gap-3">
                <SubmitButton text="Save Changes" className="w-full" />
                <button 
                  type="button"
                  onClick={handleDelete}
                  className="w-full py-2 px-4 rounded-md text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete Lead
                </button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
