const fs = require('fs');
let code = fs.readFileSync('src/app/components/ManagerDashboard.tsx', 'utf8');

// 1. Add header above KPI cards
const kpiStart = `    <div className="space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">`;
const headerReplacement = `    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard Overview</h2>
        <AuditLogsWidget logs={auditLogs} employees={employees} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">`;
code = code.replace(kpiStart, headerReplacement);

// 2. Change chart grid and remove AuditLogsWidget from bottom
const oldChart = `      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 h-96 flex flex-col relative overflow-hidden">`;
const newChart = `      <div className="w-full">
        <div className="w-full bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 h-96 flex flex-col relative overflow-hidden">`;
code = code.replace(oldChart, newChart);

const oldAuditWidget = `        </div>

        <div className="lg:col-span-1 h-96">
          <AuditLogsWidget logs={auditLogs} employees={employees} />
        </div>
      </div>`;
const newAuditWidget = `        </div>
      </div>`;
code = code.replace(oldAuditWidget, newAuditWidget);

fs.writeFileSync('src/app/components/ManagerDashboard.tsx', code);
console.log("Patched ManagerDashboard.tsx");
