'use client';

import { Lead, Employee } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type Props = {
  employees: Employee[];
  leads: Lead[];
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF'];

export default function ManagerDashboard({ employees, leads }: Props) {
  // Aggregate data for Leaderboard / Bar Chart
  const employeePerformance = employees.map(emp => {
    const conversions = leads.filter(l => l.employeeId === emp.id && l.status === 'Converted').length;
    const pending = leads.filter(l => l.employeeId === emp.id && l.status !== 'Converted').length;
    return {
      name: emp.name,
      conversions,
      pending
    };
  }).sort((a, b) => b.conversions - a.conversions);

  // Aggregate data for Pie Chart (Lead Stages)
  const stageCounts = leads.reduce((acc, lead) => {
    const stage = lead.status || 'Pending';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(stageCounts).map(key => ({
    name: key,
    value: stageCounts[key]
  }));

  return (
    <div className="space-y-8 mt-12 border-t pt-8">
      <h2 className="text-3xl font-bold text-gray-800">Manager Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Leaderboard Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Top Performers (Conversions)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeePerformance.slice(0, 5)}>
                <XAxis dataKey="name" stroke="#8884d8" />
                <YAxis />
                <Tooltip wrapperStyle={{ borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="conversions" fill="#00C49F" name="Converted Deals" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="#FFBB28" name="Active/Pending Leads" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Stages Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Company-wide Lead Stages</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Simple Leaderboard Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Sales Leaderboard</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-gray-500">Rank</th>
              <th className="py-2 text-gray-500">Employee</th>
              <th className="py-2 text-gray-500">Conversions</th>
              <th className="py-2 text-gray-500">Active Leads</th>
            </tr>
          </thead>
          <tbody>
            {employeePerformance.map((emp, index) => (
              <tr key={emp.name} className="border-b hover:bg-gray-50">
                <td className="py-3 text-lg font-bold text-gray-400">#{index + 1}</td>
                <td className="py-3 font-medium text-gray-800">{emp.name}</td>
                <td className="py-3 text-green-600 font-semibold">{emp.conversions}</td>
                <td className="py-3 text-yellow-600">{emp.pending}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
