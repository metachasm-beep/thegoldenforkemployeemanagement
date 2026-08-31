'use client';

import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';

interface CompanyLogoProps {
  name: string;
  size?: number;
  className?: string;
}

export default function CompanyLogo({ name, size = 32, className = '' }: CompanyLogoProps) {
  const [domain, setDomain] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDomain() {
      if (!name || name === 'Unnamed Lead') {
        setLoading(false);
        setError(true);
        return;
      }
      
      try {
        const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(name)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0 && data[0].domain) {
            setDomain(data[0].domain);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    
    // Only search if we don't have a domain yet
    if (!domain && !error) {
      fetchDomain();
    }
  }, [name, domain, error]);

  if (loading) {
    return (
      <div 
        className={`bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  if (error || !domain) {
    return (
      <div 
        className={`bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Building2 size={Math.max(12, size * 0.5)} />
      </div>
    );
  }

  return (
    <img
      src={`https://logo.clearbit.com/${domain}?size=${size * 2}`}
      alt={`${name} logo`}
      width={size}
      height={size}
      className={`rounded-md object-contain bg-white shrink-0 ${className}`}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}
