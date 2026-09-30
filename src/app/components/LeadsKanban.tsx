'use client';

import { Lead, Employee } from '@/types';
import { updateLead, deleteLead } from '@/services/leadService';
import { useState, useEffect, useMemo, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Search, LayoutList, LayoutGrid, User, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/primitives';
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
import EditLeadModal from './EditLeadModal';
import ViewLeadModal from './ViewLeadModal';
import CompanyLogo from './CompanyLogo';
import SubmitButton from './SubmitButton';
import CustomFieldsRenderer from './CustomFieldsRenderer';
import { extractCustomFields } from '@/lib/customFieldsUtils';
import { CustomFieldDefinition } from '@/types';

type Props = {
  leads: Lead[];
  employees: Employee[];
  isManager?: boolean;
  customFieldDefs?: CustomFieldDefinition[];
};

const STAGES = ['Lead Captured', 'Proposal Sent', 'Pending Verification', 'Converted', 'Lost'];

export default function LeadsKanban({ leads: initialLeads, employees, isManager = false, customFieldDefs = [] }: Props) {
  const [mounted, setMounted] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  
  const [isCompact, setIsCompact] = useState(false);

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
      name: formData.get('name') as string,
      status: formData.get('status') as string,
      followUp: formData.get('followUp') as string,
      notes: formData.get('notes') as string,
      customFields: extractCustomFields(formData)
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
      <div className="flex justify-end items-center mb-4">
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

      {/* Mobile Stage Selector */}
      <div className="flex md:hidden overflow-x-auto pb-2 gap-2 snap-x hide-scrollbar">
        {STAGES.map(stage => {
          const count = leads.filter(l => (l.status || 'Lead Captured') === stage).length;
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
            const stageLeads = leads.filter(l => (l.status || 'Lead Captured') === stage);
            
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
                      <span className="spatial-card text-gray-700 dark:text-gray-200 text-xs px-2.5 py-1 rounded-full shadow-sm tabular-nums">
                        {stageLeads.length}
                      </span>
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto pr-1 pb-4">
                      {stageLeads.map((lead, index) => (
                        <Draggable key={lead.leadId} draggableId={lead.leadId} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => handleCardClick(lead)}
                              style={{...provided.draggableProps.style}}
                              className={`spatial-card rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-soft-gradient mb-3 ${
                                snapshot.isDragging 
                                  ? 'drag-ghost z-50' 
                                  : 'border-gray-100 dark:border-gray-800 cursor-grab hover:border-gray-300 dark:hover:border-gray-600'
                              } ${stage === 'Converted' ? 'bg-converted-highlight' : ''} ${isCompact ? 'p-3' : 'p-4'}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2 max-w-[80%] overflow-hidden">
                                  <CompanyLogo name={lead.name} size={isCompact ? 20 : 28} />
                                  <p className={`font-lexend font-semibold text-gray-900 dark:text-gray-100 ${isCompact ? 'text-xs truncate' : 'fluid-text-base truncate'}`}>
                                    {lead.name || 'Unnamed Lead'}
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

                              {!isCompact && lead.customFields && Object.keys(lead.customFields).length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {Object.entries(lead.customFields).map(([k, v]) => {
                                    const def = customFieldDefs.find(d => d.name === k);
                                    if (!v) return null;
                                    return (
                                      <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 truncate max-w-full">
                                        {def?.label || k}: {v as string}
                                      </span>
                                    );
                                  })}
                                </div>
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

      {isManager ? (
        <ViewLeadModal
          selectedLead={selectedLead}
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          employees={employees}
          customFieldDefs={customFieldDefs}
        />
      ) : (
        <EditLeadModal 
          selectedLead={selectedLead}
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          employees={employees}
          customFieldDefs={customFieldDefs}
        />
      )}
    </div>
  );
}
