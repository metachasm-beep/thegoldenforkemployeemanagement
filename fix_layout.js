const fs = require('fs');
let code = fs.readFileSync('src/app/components/AuditLogsWidget.tsx', 'utf8');

const targetHeader = `        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 shrink-0">
            <Shield className="text-indigo-500" />
            System Audit Logs
          </h3>
          
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <div className="relative flex-1 min-w-[120px] sm:w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
              />
            </div>
            
            <select 
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
              className="h-9 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-w-[130px]"
            >
              <option value="ALL">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
              ))}
            </select>

            <button 
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 ml-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors shrink-0"
              title={isFullScreen ? "Exit full screen" : "Full screen"}
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>`;

const replacementHeader = `        <div className={\`flex justify-between shrink-0 \${isFullScreen ? 'flex-col sm:flex-row items-start sm:items-center gap-4 mb-6' : 'flex-col items-start gap-3 mb-4'}\`}>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 shrink-0">
            <Shield className="text-indigo-500" />
            System Audit Logs
          </h3>
          
          <div className={\`flex items-center gap-2 w-full \${isFullScreen ? 'sm:w-auto' : ''}\`}>
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs sm:text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 w-full"
              />
            </div>
            
            <select 
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
              className="h-9 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2 py-1 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-0 max-w-[140px] truncate"
            >
              <option value="ALL">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
              ))}
            </select>

            <button 
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 border border-transparent dark:border-gray-800 text-gray-500 transition-colors shrink-0"
              title={isFullScreen ? "Exit full screen" : "Full screen"}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>`;

if(code.includes(targetHeader)) {
    code = code.replace(targetHeader, replacementHeader);
    fs.writeFileSync('src/app/components/AuditLogsWidget.tsx', code);
    console.log("Patched successfully.");
} else {
    console.log("Could not find target block.");
}
