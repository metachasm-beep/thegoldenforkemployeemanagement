"use client";
import { useState, useEffect } from "react";
import { BellRing, BellOff } from "lucide-react";
import { toast } from "sonner";

export default function PushNotificationToggle() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const enablePush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications are not supported in your browser.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      
      if (perm === "granted") {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });

        await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription)
        });
        toast.success("Push notifications enabled!");
      } else {
        toast.error("Notifications blocked by browser.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to enable push notifications");
    }
  };

  if (permission === "granted") return null;

  return (
    <button 
      onClick={enablePush}
      className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-full hover:bg-amber-500/20 transition-colors"
      title="Enable Push Notifications"
    >
      <BellRing size={14} />
      Enable Notifications
    </button>
  );
}
