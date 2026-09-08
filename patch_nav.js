const fs = require('fs');
let code = fs.readFileSync('src/app/components/DashboardLayout.tsx', 'utf8');

code = code.replace(
  "import { Home, Users, BarChart3, Settings, LogOut, Target, Receipt, Calendar, CheckCircle } from \"lucide-react\";",
  "import { Home, Users, BarChart3, Settings, LogOut, Target, Receipt, Calendar, CheckCircle, MessageSquare } from \"lucide-react\";"
);

code = code.replace(
  '<NavLink href="/" icon={Home} label="Dashboard" />',
  '<NavLink href="/" icon={Home} label="Dashboard" />\n          <NavLink href="/chat" icon={MessageSquare} label="Messages" />'
);

code = code.replace(
  '<Link href="/" className={`p-2 flex flex-col items-center ${pathname === \'/\' ? \'text-amber-600\' : \'text-gray-500\'}`}>\n            <Home size={20} />\n            <span className="text-[10px] mt-1">Home</span>\n          </Link>',
  '<Link href="/" className={`p-2 flex flex-col items-center ${pathname === \'/\' ? \'text-amber-600\' : \'text-gray-500\'}`}>\n            <Home size={20} />\n            <span className="text-[10px] mt-1">Home</span>\n          </Link>\n          <Link href="/chat" className={`p-2 flex flex-col items-center ${pathname.startsWith(\'/chat\') ? \'text-amber-600\' : \'text-gray-500\'}`}>\n            <MessageSquare size={20} />\n            <span className="text-[10px] mt-1">Chat</span>\n          </Link>'
);

fs.writeFileSync('src/app/components/DashboardLayout.tsx', code);
console.log("Updated DashboardLayout with Chat icon");
