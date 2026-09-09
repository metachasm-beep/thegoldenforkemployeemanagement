import Image from 'next/image';
import { Employee } from '@/types';
import { Users, Megaphone, Lock, TrendingUp } from 'lucide-react';

export const getInitials = (name: string) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export const getColorFromText = (text: string) => {
  if (!text) return 'bg-gray-500';
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 
    'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
  ];
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const InitialsAvatar = ({ name, className = "w-8 h-8 text-xs" }: { name: string, className?: string }) => {
  const color = getColorFromText(name);
  return (
    <div className={`flex items-center justify-center rounded-full text-white font-bold shrink-0 ${color} ${className}`}>
      {getInitials(name)}
    </div>
  );
};

export const GroupAvatar = ({ name, className = "w-8 h-8" }: { name: string, className?: string }) => {
  let Icon = Users;
  let color = 'bg-blue-500';
  
  if (name.includes('announcements')) {
    Icon = Megaphone;
    color = 'bg-amber-500';
  } else if (name.includes('hr-private')) {
    Icon = Lock;
    color = 'bg-red-500';
  } else if (name.includes('leadership')) {
    Icon = TrendingUp;
    color = 'bg-indigo-500';
  }

  return (
    <div className={`flex items-center justify-center rounded-full text-white shrink-0 ${color} ${className}`}>
      <Icon size={14} />
    </div>
  );
};

export const EmployeeAvatar = ({ emp, presence, className = "w-8 h-8" }: { emp: Employee, presence: Record<string, string>, className?: string }) => {
  const stat = presence[emp.id] || 'offline';
  return (
    <div className="relative group shrink-0 mt-1 cursor-pointer z-10">
      <div className={`relative ${className} rounded-full overflow-hidden shrink-0`}>
        {emp.avatarUrl ? (
          <Image src={emp.avatarUrl} alt={emp.name} fill className="object-cover" />
        ) : (
          <InitialsAvatar name={emp.name} className={`w-full h-full ${className.includes('w-10') ? 'text-sm' : 'text-xs'}`} />
        )}
      </div>
      <div className={`absolute -bottom-1 -right-1 border-2 border-white dark:border-gray-900 rounded-full ${className.includes('w-10') ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${stat === 'online' ? 'bg-green-500' : stat === 'away' ? 'bg-yellow-400' : 'bg-gray-400'}`}></div>
      <div className="absolute left-10 top-0 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] p-3 pointer-events-none">
        <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {emp.name}
          {emp.target >= 100000 && <span title="Top Seller" className="text-amber-500">⭐</span>}
          {emp.isProbation && <span title="On Probation" className="text-red-500">⚠️</span>}
        </p>
        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-2">{emp.role}</p>
      </div>
    </div>
  );
};
