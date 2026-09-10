const fs = require("fs");
let content = fs.readFileSync("src/app/components/DashboardLayout.tsx", "utf8");

content = content.replace(
  /className=\{`flex items-center gap-3 px-3 py-2\.5 rounded-lg font-medium transition-colors \$\{active \? 'bg-amber-50 dark:bg-amber-900\/20 text-amber-600 dark:text-amber-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800\/50 hover:text-gray-900 dark:hover:text-gray-200'\}`\}/,
  `className={\`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors \$\{active ? 'spatial-glass text-amber-600 dark:text-amber-400 font-bold shadow-md' : 'text-gray-600 dark:text-gray-400 hover:spatial-glass hover:text-gray-900 dark:hover:text-gray-100'\}\`}`
);

content = content.replace(
  /<div className="flex h-dvh bg-slate-50\/50 dark:bg-slate-950\/50 transition-colors duration-300 relative">/,
  `<div className="flex h-dvh bg-slate-100 dark:bg-black transition-colors duration-300 relative overflow-hidden">
      {/* Cinematic Blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-400/40 dark:bg-purple-600/30 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-400/30 dark:bg-blue-600/20 blur-[120px] rounded-full pointer-events-none z-0"></div>`
);

content = content.replace(
  /<aside className="hidden md:flex flex-col w-64 bg-white\/80 dark:bg-gray-950\/80 backdrop-blur-md border-r border-gray-200 dark:border-gray-800 shrink-0 z-10">/,
  `<aside className="hidden md:flex flex-col w-64 spatial-glass shrink-0 z-10 !border-y-0 !border-l-0">`
);

content = content.replace(
  /<header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white\/50 dark:bg-gray-950\/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 z-10 dashboard-header">/,
  `<header className="h-16 spatial-glass flex items-center justify-between px-4 md:px-8 shrink-0 z-10 dashboard-header !border-x-0 !border-t-0 !shadow-none">`
);

content = content.replace(
  /<div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex items-center justify-around p-2 z-50 env\(safe-area-inset-bottom\)">/,
  `<div className="md:hidden fixed bottom-0 left-0 right-0 spatial-glass flex items-center justify-around p-2 z-50 env(safe-area-inset-bottom) !border-x-0 !border-b-0">`
);

fs.writeFileSync("src/app/components/DashboardLayout.tsx", content);
console.log("Updated DashboardLayout.tsx");

