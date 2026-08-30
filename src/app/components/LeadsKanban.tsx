'use client';

import { Lead, Employee } from '@/types';
import { updateLead } from '../actions';
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { MessageSquare, Calendar } from 'lucide-react';

type Props = {
  leads: Lead[];
  employees: Employee[];
  isManager?: boolean;
};

const STAGES = ['Pending', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Pending Verification', 'Converted', 'Lost'];

export default function LeadsKanban({ leads: initialLeads, employees, isManager = false }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    let newStage = destination.droppableId;
    
    if (newStage === 'Converted' && !isManager) {
      newStage = 'Pending Verification';
      toast('Sent to Manager for Verification!', { icon: '⏳' });
    }
    
    // Optimistic UI update
    setLeads(current => 
      current.map(l => l.leadId === draggableId ? { ...l, status: newStage } : l)
    );

    // Confetti if converted
    if (newStage === 'Converted') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#F59E0B']
      });
    }

    try {
      
      
      
      await updateLead(draggableId, { stage: newStage } as any);
      toast.success(`Lead moved to ${newStage}`);
    } catch (e) {
      toast.error('Failed to update lead');
      setLeads(initialLeads); // revert
    }
  };

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.name : 'Unknown';
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 pb-4">
        {STAGES.map(stage => (
          <Droppable key={stage} droppableId={stage}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`rounded-2xl border p-4 flex flex-col transition-colors min-h-[400px] ${
                  snapshot.isDraggingOver 
                    ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                    : 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800'
                }`}
              >
                <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex justify-between items-center px-1">
                  {stage}
                  <span className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-2.5 py-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 tabular-nums">
                    {leads.filter(l => (l.status || 'Pending') === stage).length}
                  </span>
                </h3>
                
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {leads.filter(l => (l.status || 'Pending') === stage).map((lead, index) => (
                    <Draggable key={lead.leadId} draggableId={lead.leadId} index={index}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border transition-shadow ${
                            snapshot.isDragging 
                              ? 'shadow-xl border-blue-300 dark:border-blue-700 rotate-2 cursor-grabbing' 
                              : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 cursor-grab'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                              <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{lead.assignee || 'Unnamed Lead'}</p>
                              {stage === 'Converted' && <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">WON</span>}
                              {stage === 'Lost' && <span className="text-red-600 dark:text-red-400 text-[10px] font-bold bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">LOST</span>}
                            </div>
                            
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{getEmployeeName(lead.employeeId)}</p>
                            
                            {lead.notes && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 italic border-l-2 border-indigo-200 dark:border-indigo-800 pl-2 mb-3">
                                "{lead.notes}"
                              </p>
                            )}
                            
                            <div className="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-gray-800/50">
                              <span className="text-[10px] text-gray-400 font-medium">{lead.date}</span>
                              {lead.followUp && (
                                <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md font-medium">
                                  Follow-up: {lead.followUp}
                                </span>
                              )}
                            </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {leads.filter(l => (l.status || 'Pending') === stage).length === 0 && !snapshot.isDraggingOver && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                      <span className="text-sm text-gray-400 dark:text-gray-600 font-medium">Drop here</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
