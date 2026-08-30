import DashboardLayout from '../components/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { updateSystemSetting, updateProfile } from '../actions';
import { getSystemSettings } from '@/lib/db/settings';
import { getEmployees } from '@/lib/db/employees';
import { revalidatePath } from 'next/cache';
import SubmitButton from '../components/SubmitButton';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  
  const user = session.user as any;
  const isManager = user.role === 'Manager';
  const employeeId = user.employeeId;

  const employees = await getEmployees();
  const me = employees.find(e => e.id === employeeId);

  const settings = await getSystemSettings();
  const blindMode = settings['LeaderboardBlindMode'] === 'true';

  async function handleBroadcast(formData: FormData) {
    'use server';
    const msg = formData.get('message') as string;
    await updateSystemSetting('BroadcastMessage', msg);
    revalidatePath('/settings');
  }

  async function toggleBlindMode() {
    'use server';
    const settings = await getSystemSettings();
    const current = settings['LeaderboardBlindMode'] === 'true';
    await updateSystemSetting('LeaderboardBlindMode', current ? 'false' : 'true');
    revalidatePath('/settings');
  }

  async function handleProfileUpdate(formData: FormData) {
    'use server';
    const panNumber = formData.get('panNumber') as string;
    const aadhaarNumber = formData.get('aadhaarNumber') as string;
    const dpdpConsent = formData.get('dpdpConsent');
    
    if (!dpdpConsent && (panNumber || aadhaarNumber)) {
      throw new Error('You must consent to the DPDP Act to save this information.');
    }

    if (employeeId) {
      await updateProfile(employeeId, { panNumber, aadhaarNumber });
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Personal Information</h2>
            <p className="text-gray-500 mb-6 text-sm">Update your PAN and Aadhaar details. These are required for generating your official monthly paystub.</p>
            <form action={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PAN Number</label>
                <input type="text" name="panNumber" defaultValue={(me as any)?.panNumber || ''} placeholder="ABCDE1234F" className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aadhaar Number</label>
                <input type="text" name="aadhaarNumber" defaultValue={(me as any)?.aadhaarNumber || ''} placeholder="1234 5678 9012" className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <input type="checkbox" id="dpdpConsent" name="dpdpConsent" required defaultChecked={!!((me as any)?.panNumber || (me as any)?.aadhaarNumber)} className="mt-1" />
                <label htmlFor="dpdpConsent" className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  <strong>Consent under the Digital Personal Data Protection (DPDP) Act, 2023:</strong> I hereby give my free, specific, informed, unconditional, and unambiguous consent to Metachasm Enterprises to collect, store, and process my PAN and Aadhaar details solely for the purposes of payroll processing, and regulatory compliance.
                </label>
              </div>

              <SubmitButton text="Save Details" loadingText="Saving..." />
            </form>
          </section>

          {isManager && (
            <>
              <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">System Broadcast</h2>
                <p className="text-gray-500 mb-6 text-sm">Push a scrolling marquee alert to all employee dashboards.</p>
                <form action={handleBroadcast} className="flex gap-2">
                  <input type="text" name="message" defaultValue={settings['BroadcastMessage'] || ''} placeholder="e.g. End of month push!" className="flex-1 px-4 py-2 border dark:border-gray-700 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-white" />
                  <SubmitButton text="Broadcast" loadingText="Pushing..." />
                </form>
              </section>

              <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Leaderboard Privacy</h2>
                <p className="text-gray-500 mb-6 text-sm">Blind Mode masks exact earnings/conversions for competitors on the employee dashboard.</p>
                <form action={toggleBlindMode}>
                  <SubmitButton 
                    text={blindMode ? 'Blind Mode: ACTIVE' : 'Blind Mode: OFF'} 
                    loadingText="Toggling..." 
                    className={`py-3 ${blindMode ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`} 
                  />
                </form>
              </section>

              <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Data Export</h2>
                <p className="text-gray-500 mb-6 text-sm">Export all payroll and CRM data for accounting software like QuickBooks. This action triggers an audit alert to the Owner.</p>
                <form action={async () => {
                  'use server';
                  const { triggerExportAudit } = await import('../actions');
                  await triggerExportAudit();
                }}>
                  <SubmitButton 
                    text="Export Master Payroll (.CSV)" 
                    loadingText="Exporting..." 
                    className="bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 py-3" 
                  />
                </form>
              </section>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
