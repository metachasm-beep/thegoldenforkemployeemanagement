'use client';

import { useState } from 'react';
import { addEmployee } from '../actions';
import toast from 'react-hot-toast';
import Stepper, { Step } from '@/components/react-bits/Stepper/Stepper';

import { Employee } from '@/types';

export default function EmployeeForm({ teamLeads }: { teamLeads: Employee[] }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', role: '', email: '', baseSalary: '15000', commissionRate: '3000', target: '5', probationDuration: '1', managerId: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  async function handleSubmit() {
    setLoading(true);
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    await addEmployee(fd);
    setFormData({ name: '', role: '', email: '', baseSalary: '15000', commissionRate: '3000', target: '5', probationDuration: '1', managerId: '' });
    toast.success('Employee onboarded successfully!');
    setLoading(false);
  }

  return (
    <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
      <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-200">Onboard New Hire</h2>
      
      <div className="w-full">
        <Stepper
          initialStep={1}
          onFinalStepCompleted={handleSubmit}
          backButtonText="Previous"
          nextButtonText="Continue"
          stepCircleContainerClassName="mb-6"
        >
          <Step>
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">Basic Info</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="text-black dark:text-white mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <input type="text" name="role" value={formData.role} onChange={handleChange} required className="text-black dark:text-white mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="text-black dark:text-white mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
            </div>
          </Step>

          <Step>
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">Compensation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Base Salary (₹)</label>
                  <input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleChange} required min="0" step="100" className="text-black dark:text-white mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Commission (₹)</label>
                  <input type="number" name="commissionRate" value={formData.commissionRate} onChange={handleChange} required min="0" step="10" className="text-black dark:text-white mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
            </div>
          </Step>

          <Step>
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">Assignment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Quota (Sales)</label>
                  <input type="number" name="target" value={formData.target} onChange={handleChange} required min="1" className="text-black dark:text-white mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Probation (Months)</label>
                  <input type="number" name="probationDuration" value={formData.probationDuration} onChange={handleChange} required min="0" className="text-black dark:text-white mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign to Team Lead</label>
                <select name="managerId" value={formData.managerId} onChange={handleChange} className="text-black dark:text-white mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none">
                  <option value="">-- None (Direct to Manager) --</option>
                  {teamLeads.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </Step>
        </Stepper>
      </div>
      {loading && <div className="mt-4 text-sm text-blue-600 font-bold animate-pulse text-center w-full">Onboarding employee...</div>}
    </section>
  );
}
