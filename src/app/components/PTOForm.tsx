'use client';
import { addPTO } from '../actions';
import { useRef } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import SubmitButton from './SubmitButton';

export default function PTOForm({ employeeId }: { employeeId: string }) {
  const ptoRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handlePTOSubmit = async (formData: FormData) => {
    formData.append('employeeId', employeeId);
    await addPTO(formData);
    ptoRef.current?.reset();
    toast.success('PTO Requested!');
    router.push('/');
    router.refresh();
  };

  return (
    <form ref={ptoRef} action={handlePTOSubmit} className="space-y-6 mt-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
        <input type="date" name="startDate" required className="text-black dark:text-white w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
        <input type="date" name="endDate" required className="text-black dark:text-white w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800" />
      </div>
      <SubmitButton 
        text="Submit Request" 
        loadingText="Submitting..." 
        className="w-full py-3 text-base" 
      />
    </form>
  );
}
