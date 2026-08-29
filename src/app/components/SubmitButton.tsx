'use client';

import { useFormStatus } from 'react-dom';

interface Props {
  text: string;
  loadingText?: string;
  className?: string;
  variant?: 'primary' | 'danger';
  disabled?: boolean;
}

export default function SubmitButton({ 
  text, 
  loadingText = 'Processing...', 
  className = '',
  variant = 'primary',
  disabled = false
}: Props) {
  const { pending } = useFormStatus();

  const baseStyles = "px-4 py-2 font-bold rounded-lg transition-colors flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400 disabled:cursor-not-allowed",
    danger: "bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400 disabled:cursor-not-allowed"
  };

  return (
    <button 
      type="submit" 
      disabled={pending || disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {pending && (
        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {pending ? loadingText : text}
    </button>
  );
}
