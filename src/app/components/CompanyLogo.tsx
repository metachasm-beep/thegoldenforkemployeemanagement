'use client';

import Avatar from 'boring-avatars';

interface CompanyLogoProps {
  name: string;
  size?: number;
  className?: string;
}

export default function CompanyLogo({ name, size = 32, className = '' }: CompanyLogoProps) {
  const safeName = name && name.trim().length > 0 ? name.trim() : 'Unnamed Lead';

  return (
    <div
      className={`rounded-md overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label={`${safeName} avatar`}
    >
      <Avatar
        size={size}
        name={safeName}
        variant="beam"
        colors={['#3b82f6', '#10b981', '#6366f1', '#eab308', '#ec4899']}
      />
    </div>
  );
}
