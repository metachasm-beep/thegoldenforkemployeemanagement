'use client';
import { useEffect, useState } from 'react';

export default function ClientDate({ date }: { date: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="opacity-0">Loading...</span>;
  }

  return <span>{new Date(date).toLocaleString()}</span>;
}
