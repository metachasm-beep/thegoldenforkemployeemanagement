'use client';
import { useState, useRef } from 'react';
import { uploadAvatar } from '../actions';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { Camera, Loader2 } from 'lucide-react';

export default function ProfileAvatar() {
  const { data: session, update } = useSession();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as any;
  if (!user) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('File too large (max 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setUploading(true);
      
      const fd = new FormData();
      fd.append('employeeId', user.employeeId);
      fd.append('base64Image', base64);
      
      const res = await uploadAvatar(fd);
      if (res.success) {
        toast.success('Profile picture updated!');
        await update({ avatarUrl: base64 });
        window.location.reload();
      } else {
        toast.error('Failed to update picture: ' + res.error);
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const avatarUrl = user.avatarUrl || user.image;

  return (
    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
      <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800 overflow-hidden relative shadow-sm">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span>{user.email?.charAt(0).toUpperCase()}</span>
        )}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {uploading ? <Loader2 size={16} className="text-white animate-spin" /> : <Camera size={16} className="text-white" />}
        </div>
      </div>
      <input 
        type="file" 
        accept="image/png, image/jpeg, image/webp" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        disabled={uploading}
      />
    </div>
  );
}
