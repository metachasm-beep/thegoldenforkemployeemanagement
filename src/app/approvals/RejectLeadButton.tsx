'use client';

import { useState } from 'react';
import { updateLeadStatusWithReason } from '../actions';
import { toast } from 'sonner';

export default function RejectLeadButton({ leadId }: { leadId: string }) {
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    const reason = window.prompt("Please enter the reason for rejection:");
    if (reason === null) return; // User cancelled
    if (reason.trim() === '') {
      toast.error('You must provide a reason for rejection.');
      return;
    }

    setLoading(true);
    try {
      // Revert status to Proposal Sent and provide reason
      await updateLeadStatusWithReason(leadId, 'Proposal Sent', reason);
      toast.success('Sale conversion rejected.');
    } catch (e) {
      toast.error('Failed to reject sale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleReject}
      disabled={loading}
      className="px-4 py-2 text-sm rounded-xl font-bold transition-all bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 disabled:opacity-50"
    >
      {loading ? 'Wait...' : 'Reject'}
    </button>
  );
}
