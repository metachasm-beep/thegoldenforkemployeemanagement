"use client";
import { useState, useEffect } from "react";
import { Download } from "lucide-react";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (!deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <button onClick={handleInstall} className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 w-full text-left mt-2">
      <Download size={20} /> Install App
    </button>
  );
}

