'use client';

import { useState, useEffect } from 'react';
import { addLead, checkDuplicateLead } from '@/services/leadService';
import { Employee } from '@/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const OBJECTIONS_LIST = ['Price', 'Competitor', 'Timing', 'Authority', 'Feature Missing'];
const NEXT_ACTIONS = ['Call', 'Email', 'Demo', 'Contract', 'In-Person Meeting'];

export default function LeadForm({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<'single' | 'batch'>('single');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [objections, setObjections] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    linkedIn: '',
    status: 'Lead Captured',
    nextAction: 'Call',
    followUp: '',
    notes: '',
  });

  // Pre-fill smart follow up date based on status
  useEffect(() => {
    if (!formData.followUp) {
      const date = new Date();
      if (formData.status === 'Lead Captured') date.setDate(date.getDate() + 1); // +24 hours
      else if (formData.status === 'Proposal Sent') date.setDate(date.getDate() + 3); // +3 days
      else date.setDate(date.getDate() + 7);
      setFormData(prev => ({ ...prev, followUp: date.toISOString().split('T')[0] }));
    }
  }, [formData.status]);

  // LocalStorage Draft
  useEffect(() => {
    const saved = localStorage.getItem('lead_form_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData);
        setObjections(parsed.objections);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lead_form_draft', JSON.stringify({ formData, objections }));
  }, [formData, objections]);

  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value;
    if (email) {
      const isDuplicate = await checkDuplicateLead(email);
      if (isDuplicate) setDuplicateWarning('Warning: A lead with this email already exists in the system.');
      else setDuplicateWarning(null);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    if (val.length >= 7) {
      val = `(${val.slice(0,3)}) ${val.slice(3,6)}-${val.slice(6)}`;
    } else if (val.length >= 4) {
      val = `(${val.slice(0,3)}) ${val.slice(3)}`;
    }
    setFormData(prev => ({ ...prev, phone: val }));
  };

  const toggleObjection = (obj: string) => {
    setObjections(prev => prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    fd.append('name', formData.name);
    fd.append('email', formData.email);
    fd.append('phone', formData.phone);
    fd.append('linkedIn', formData.linkedIn);
    fd.append('status', formData.status);
    fd.append('nextAction', formData.nextAction);
    fd.append('followUp', formData.followUp);
    fd.append('notes', formData.notes);
    fd.append('objections', objections.join(', '));
    // employeeId defaults to logged-in user inside addLead, but we pass it just in case
    if (employees.length > 0) fd.append('employeeId', employees[0].id);

    const res = await addLead(fd);
    
    if (res?.success) {
      toast.success('Lead Logged Successfully!');
      localStorage.removeItem('lead_form_draft');
      
      if (actionType === 'batch') {
        setFormData({
          name: '', email: '', phone: '', linkedIn: '', status: 'Lead Captured', nextAction: 'Call', followUp: '', notes: ''
        });
        setObjections([]);
        setDuplicateWarning(null);
      } else {
        router.push('/');
        router.refresh();
      }
    } else {
      toast.error(res?.error || 'Failed to log lead.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 min-h-[400px]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="leadName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lead Name</label>
          <input id="leadName" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Jane Doe" className="focus:ring-2 focus:ring-blue-500 min-h-[44px] text-black dark:text-white w-full px-4 py-2 border rounded-lg outline-none dark:bg-gray-800 dark:border-gray-700 transition-shadow" />
        </div>
        <div>
          <label htmlFor="leadEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input id="leadEmail" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} onBlur={handleEmailBlur} placeholder="jane@example.com" className="focus:ring-2 focus:ring-blue-500 min-h-[44px] text-black dark:text-white w-full px-4 py-2 border rounded-lg outline-none dark:bg-gray-800 dark:border-gray-700 transition-shadow" />
          {duplicateWarning && <p className="text-orange-500 text-xs mt-1 font-medium animate-pulse">{duplicateWarning}</p>}
        </div>
        <div>
          <label htmlFor="leadPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
          <input id="leadPhone" type="tel" value={formData.phone} onChange={handlePhoneChange} placeholder="(555) 123-4567" className="focus:ring-2 focus:ring-blue-500 min-h-[44px] text-black dark:text-white w-full px-4 py-2 border rounded-lg outline-none dark:bg-gray-800 dark:border-gray-700 transition-shadow" />
        </div>
        <div>
          <label htmlFor="leadLinkedIn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LinkedIn URL</label>
          <input id="leadLinkedIn" type="url" value={formData.linkedIn} onChange={e => setFormData({...formData, linkedIn: e.target.value})} placeholder="https://linkedin.com/in/..." className="focus:ring-2 focus:ring-blue-500 min-h-[44px] text-black dark:text-white w-full px-4 py-2 border rounded-lg outline-none dark:bg-gray-800 dark:border-gray-700 transition-shadow" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
        <div>
          <label htmlFor="leadStage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stage</label>
          <select id="leadStage" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="focus:ring-2 focus:ring-blue-500 min-h-[44px] text-black dark:text-white w-full px-4 py-2 border rounded-lg outline-none bg-white dark:bg-gray-800 dark:border-gray-700">
            <option value="Lead Captured">Lead Captured</option>
            <option value="Proposal Sent">Proposal Sent</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
        <div>
          <label htmlFor="leadNextAction" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Action</label>
          <select id="leadNextAction" value={formData.nextAction} onChange={e => setFormData({...formData, nextAction: e.target.value})} className="focus:ring-2 focus:ring-blue-500 min-h-[44px] text-black dark:text-white w-full px-4 py-2 border rounded-lg outline-none bg-white dark:bg-gray-800 dark:border-gray-700">
            {NEXT_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="leadFollowUp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Follow-up Date</label>
          <input id="leadFollowUp" type="date" value={formData.followUp} onChange={e => setFormData({...formData, followUp: e.target.value})} required className="focus:ring-2 focus:ring-blue-500 min-h-[44px] text-black dark:text-white w-full px-4 py-2 border rounded-lg outline-none dark:bg-gray-800 dark:border-gray-700 transition-shadow" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Objections</label>
        <div className="flex flex-wrap gap-2">
          {OBJECTIONS_LIST.map(obj => (
            <button
              type="button"
              key={obj}
              onClick={() => toggleObjection(obj)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${objections.includes(obj) ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}
            >
              {obj}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
          <span>Notes</span>
          <span className="text-xs text-gray-400 font-normal">Markdown supported</span>
        </label>
        <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="- Pain point: High costs&#10;- Budget: $10k&#10;- Decision maker: CEO" className="focus:ring-2 focus:ring-blue-500 font-mono text-sm text-black dark:text-white w-full px-4 py-3 border rounded-lg outline-none h-32 dark:bg-gray-800 dark:border-gray-700 transition-shadow"></textarea>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button 
          type="submit" 
          onClick={() => setActionType('single')}
          disabled={loading}
          className="flex-1 min-h-[44px] bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 flex justify-center items-center"
        >
          {loading && actionType === 'single' ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : 'Log Lead'}
        </button>
        <button 
          type="submit" 
          onClick={() => setActionType('batch')}
          disabled={loading}
          className="flex-1 min-h-[44px] bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-70 flex justify-center items-center"
        >
          {loading && actionType === 'batch' ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : 'Save & Add Another'}
        </button>
      </div>
    </form>
  );
}
