'use client';

import { Lead, Employee, CustomFieldDefinition } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { User, Mail, Phone, Link, Calendar, ListTodo, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import { motion } from 'framer-motion';

type Props = {
  selectedLead: Lead | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  customFieldDefs: CustomFieldDefinition[];
};

export default function ViewLeadModal({ selectedLead, isOpen, onOpenChange, employees, customFieldDefs }: Props) {
  if (!selectedLead) return null;

  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown Executive';
  const parsedObjections = selectedLead.objections 
    ? selectedLead.objections.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto spatial-glass text-gray-900 dark:text-white p-0">
        <motion.div initial="hidden" animate="visible" variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}>
        
        {/* Header Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 p-6 border-b border-gray-100 dark:border-gray-800">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-4 mb-2">
              <CompanyLogo name={selectedLead.name} size={48} />
              <div>
                <SheetTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedLead.name}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-0.5 rounded-full">
                    {selectedLead.status}
                  </span>
                  {selectedLead.status === 'Converted' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-4">
              <User className="w-4 h-4" />
              Logged by <span className="font-medium text-gray-700 dark:text-gray-300">{getEmployeeName(selectedLead.employeeId)}</span> on {new Date(selectedLead.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Contact Information */}
          <motion.section variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Contact Information</h3>
            <div className="space-y-3 bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                {selectedLead.email ? (
                  <a href={`mailto:${selectedLead.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">{selectedLead.email}</a>
                ) : (
                  <span className="text-gray-400 italic">No email provided</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                {selectedLead.phone ? (
                  <a href={`tel:${selectedLead.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">{selectedLead.phone}</a>
                ) : (
                  <span className="text-gray-400 italic">No phone provided</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Link className="w-4 h-4 text-gray-400" />
                {selectedLead.linkedIn ? (
                  <a href={selectedLead.linkedIn} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                    {selectedLead.linkedIn}
                  </a>
                ) : (
                  <span className="text-gray-400 italic">No LinkedIn provided</span>
                )}
              </div>
            </div>
          </motion.section>

          {/* Action Items */}
          <motion.section variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Action Items</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium">Follow-up Date</span>
                </div>
                <p className="font-semibold text-indigo-900 dark:text-indigo-100">{selectedLead.followUp || 'None'}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/50">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                  <ListTodo className="w-4 h-4" />
                  <span className="text-xs font-medium">Next Action</span>
                </div>
                <p className="font-semibold text-orange-900 dark:text-orange-100">{selectedLead.nextAction || 'None'}</p>
              </div>
            </div>
          </motion.section>

          {/* Objections */}
          {parsedObjections.length > 0 && (
            <motion.section variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Key Objections
              </h3>
              <div className="flex flex-wrap gap-2">
                {parsedObjections.map((obj: string) => (
                  <span key={obj} className="px-3 py-1.5 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-100 dark:border-red-900/50 rounded-lg text-sm font-medium">
                    {obj}
                  </span>
                ))}
              </div>
            </motion.section>
          )}

          {/* Notes */}
          <motion.section variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Executive Notes
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
              {selectedLead.notes || <span className="text-gray-400 italic">No notes recorded.</span>}
            </div>
          </motion.section>

          {/* Custom Fields */}
          {customFieldDefs.length > 0 && selectedLead.customFields && Object.keys(selectedLead.customFields).length > 0 && (
            <motion.section variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Custom Fields</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedLead.customFields).map(([k, v]) => {
                  const def = customFieldDefs.find(d => d.name === k);
                  if (!v) return null;
                  return (
                    <div key={k} className="bg-white dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                      <p className="text-xs text-gray-500 mb-1">{def?.label || k}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{String(v)}</p>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}

        </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
