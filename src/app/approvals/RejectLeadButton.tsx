'use client';

import { useState } from 'react';
import { updateLeadStatusWithReason } from '../actions';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function RejectLeadButton({ leadId }: { leadId: string }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const handleReject = async () => {
    if (reason.trim() === '') {
      toast.error('You must provide a reason for rejection.');
      return;
    }

    setLoading(true);
    try {
      await updateLeadStatusWithReason(leadId, 'Proposal Sent', reason);
      toast.success('Sale conversion rejected.');
      setOpen(false);
    } catch (e) {
      toast.error('Failed to reject sale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className="px-4 py-2 text-sm rounded-xl font-bold transition-all bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400"
        >
          Reject
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Sale Conversion</DialogTitle>
          <DialogDescription>
            Please provide a detailed reason for rejecting this conversion. The employee will be notified.
          </DialogDescription>
        </DialogHeader>
        <Textarea 
          placeholder="Reason for rejection..." 
          value={reason} 
          onChange={(e) => setReason(e.target.value)} 
          className="min-h-[100px]"
        />
        <DialogFooter>
          <button 
            onClick={() => setOpen(false)} 
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleReject}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            {loading ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
