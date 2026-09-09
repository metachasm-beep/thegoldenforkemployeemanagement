'use client';

import dynamic from 'next/dynamic';

const ManagerDashboard = dynamic(() => import('./ManagerDashboard'), {
  ssr: false,
  loading: () => <div className="h-96 w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-3xl" />
});

export default function LazyManagerDashboard(props: any) {
  return <ManagerDashboard {...props} />;
}

