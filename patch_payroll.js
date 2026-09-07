const fs = require('fs');
let code = fs.readFileSync('src/app/components/PayrollTable.tsx', 'utf8');

// 1. Add Search import
code = code.replace('Info } from \'lucide-react\';', 'Info, Search } from \'lucide-react\';\nimport { Input } from \'@/components/ui/input\';');

// 2. Add searchQuery state
code = code.replace('const [currentPage, setCurrentPage] = useState(1);', 'const [currentPage, setCurrentPage] = useState(1);\n  const [searchQuery, setSearchQuery] = useState(\'\');');

// 3. Filter reports before sorting
const sortBlock = `  const sortedReports = [...reports].sort((a, b) => {`;
const newSortBlock = `  const filteredReports = reports.filter(report => 
    report.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedReports = [...filteredReports].sort((a, b) => {`;
code = code.replace(sortBlock, newSortBlock);

// 4. Update pagination logic length references
code = code.replace(/reports\.length/g, 'filteredReports.length');

// 5. Add search bar UI above the table
const tableStart = `<table className="w-full text-left border-collapse min-w-[800px]">`;
const newTableStart = `<div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center gap-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 hidden sm:block">Master Payroll Ledger</h3>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search employee..." 
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
            className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>
      </div>
      <table className="w-full text-left border-collapse min-w-[800px]">`;
code = code.replace(tableStart, newTableStart);

fs.writeFileSync('src/app/components/PayrollTable.tsx', code);
console.log("Updated PayrollTable.tsx");
