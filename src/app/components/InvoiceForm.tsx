'use client';
import { generateAndStoreInvoice } from '../actions/invoiceAction';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import SubmitButton from './SubmitButton';

export default function InvoiceForm({ employeeId }: { employeeId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async (formData: FormData) => {
    setErrorMsg(null);
    const month = formData.get('month') as string;
    
    const toastId = toast.loading('Calculating payroll and generating system invoice...');
    const result = await generateAndStoreInvoice(employeeId, month);
    
    if (result.success) {
      toast.success('Invoice Generated & Stored in Database!', { id: toastId });
      router.push('/');
      router.refresh();
    } else {
      toast.error('Failed to generate invoice', { id: toastId });
      setErrorMsg(result.error);
    }
  };

  return (
    <div>
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm whitespace-pre-wrap">
          {errorMsg}
        </div>
      )}
      
      <form ref={formRef} action={handleGenerate} className="space-y-6 mt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Month</label>
          <input type="month" name="month" required className="text-black dark:text-white w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800" />
          <p className="text-xs text-gray-500 mt-2">Selecting a month will automatically calculate your conversions and bonuses for that period and save an official invoice record in the Golden Fork system database.</p>
        </div>

        <SubmitButton 
          text="Generate & Store Invoice" 
          loadingText="Processing..." 
          className="w-full py-3 text-base bg-blue-600 hover:bg-blue-700" 
        />
      </form>
    </div>
  );
}
