const fs = require("fs");
let dash = fs.readFileSync("src/app/components/ManagerDashboard.tsx", "utf8");
dash = dash.replace(
  "import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';",
  "import dynamic from 'next/dynamic';\nimport { Suspense } from 'react';\n\n// Lazy load recharts to reduce initial bundle size\nconst BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });\nconst Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });\nconst XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });\nconst Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });\nconst ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });\nconst PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false });\nconst Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false });\nconst Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false });\nconst Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false });"
);
fs.writeFileSync("src/app/components/ManagerDashboard.tsx", dash);

