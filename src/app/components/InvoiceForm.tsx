'use client';
import { submitInvoice } from '../actions';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import SubmitButton from './SubmitButton';

export default function InvoiceForm({ employeeId }: { employeeId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    formData.append('employeeId', employeeId);
    await submitInvoice(formData);
    formRef.current?.reset();
    toast.success('Invoice Submitted Successfully!');
    router.push('/');
    router.refresh();
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6 mt-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
        <input type="month" name="month" required className="text-black dark:text-white w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Amount (₹)</label>
        <input type="number" step="0.01" name="amount" required className="text-black dark:text-white w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Google Sheet URL</label>
        <input type="url" name="sheetUrl" required placeholder="https://docs.google.com/spreadsheets/d/..." className="text-black dark:text-white w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800" />
      </div>

      <SubmitButton 
        text="Submit Invoice" 
        loadingText="Submitting..." 
        className="w-full py-3 text-base" 
      />
    </form>
  );
}
