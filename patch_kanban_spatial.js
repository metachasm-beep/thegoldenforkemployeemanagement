const fs = require("fs");
let content = fs.readFileSync("src/app/components/LeadsKanban.tsx", "utf8");

content = content.replace(/bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/g, "spatial-card p-4 rounded-2xl");
content = content.replace(/bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-colors mb-3/g, "spatial-card rounded-xl transition-all mb-3 hover:spatial-card-hover shadow-lg shadow-black/5");
content = content.replace(/rounded-2xl border p-4 flex-col transition-colors h-\[600px\] \$\{.*?bg-gray-50 dark:bg-gray-800\/30.*?border-gray-200 dark:border-gray-800.*?\}/g, (match) => {
  return "spatial-glass rounded-2xl p-4 flex-col h-[600px] shadow-lg shadow-black/5 transition-all ${snapshot.isDraggingOver ? 'ring-2 ring-blue-500/50 bg-white/10 dark:bg-white/5' : ''}";
});

// Fix column headers
content = content.replace(/bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-2\.5 py-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-700/g, "spatial-card text-gray-700 dark:text-gray-200 text-xs px-2.5 py-1 rounded-full shadow-sm");

// Fix search input and selects
content = content.replace(/bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700/g, "spatial-card border-white/20 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400");

// Fix Sheet Background
content = content.replace(/bg-white dark:bg-gray-900/g, "spatial-glass text-gray-900 dark:text-white");

fs.writeFileSync("src/app/components/LeadsKanban.tsx", content);
console.log("Updated LeadsKanban.tsx");

