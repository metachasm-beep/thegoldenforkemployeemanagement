'use client';
import { useState, useRef } from 'react';
import { uploadAvatar } from '../actions';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Camera, Loader2 } from 'lucide-react';
import Image from 'next/image';

const compressImage = async (file: File, maxWidth = 400, quality = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }));
          } else {
            reject(new Error('Canvas to Blob failed'));
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function ProfileAvatar() {
  const { data: session, update } = useSession();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as any;
  if (!user) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // Increased client limit, will be compressed anyway
      toast.error('File too large (max 10MB)');
      return;
    }

    setUploading(true);
    
    try {
      const compressedFile = await compressImage(file);
      
      const fd = new FormData();
      fd.append('employeeId', user.employeeId);
      fd.append('file', compressedFile);
      
      const res = await uploadAvatar(fd);
      if (res.success) {
        toast.success('Profile picture updated!');
        await update({ avatarUrl: res.url });
        window.location.reload();
      } else {
        toast.error('Failed to update picture: ' + res.error);
      }
    } catch (err) {
      toast.error('Failed to compress or upload image');
      console.error(err);
    }
    setUploading(false);
  };

  const avatarUrl = user.avatarUrl || user.image;

  return (
    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
      <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800 overflow-hidden relative shadow-sm">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Profile" fill className="object-cover" sizes="40px" />
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
