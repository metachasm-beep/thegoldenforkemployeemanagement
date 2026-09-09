// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import Joyride (no SSR) and extract the named export Joyride
const Joyride = dynamic(() => import("react-joyride").then((mod) => mod.Joyride as any), { ssr: false });

export default function Onboarding() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Only run if the user hasn't seen it before
    const hasSeenTour = localStorage.getItem("gf_tour_completed");
    if (!hasSeenTour) {
      // Delay slightly to ensure UI is painted
      setTimeout(() => setRun(true), 1500);
    }
  }, []);

  const steps = [
    {
      target: ".dashboard-header",
      content: "Welcome to the Golden Fork Employee Management System! Let's take a comprehensive tour of your new workspace.",
      disableBeacon: true,
      placement: "bottom"
    },
    {
      target: ".tour-sidebar",
      content: "This is your main navigation rail. You can access your Dashboard, internal Team Chat, Leaderboard, and perform quick actions like Logging a Lead or PTO.",
      placement: "right"
    },
    {
      target: ".tour-command-palette",
      content: "Hit Ctrl+K (or Cmd+K) from anywhere in the app to instantly search for Employees, Leads, or jump to any page.",
      placement: "bottom"
    },
    {
      target: ".tour-theme-toggle",
      content: "Prefer a different aesthetic? Toggle between Light Mode (Frosted Glass) and Dark Mode (Premium Spatial) instantly.",
      placement: "bottom"
    },
    {
      target: ".tour-notifications",
      content: "Your Notification Center. Real-time alerts for incoming chats, assigned leads, and PTO approvals will appear here.",
      placement: "bottom"
    },
    {
      target: ".user-profile-menu",
      content: "Manage your account, update your avatar, or securely download your generated Salary Paystubs.",
      placement: "bottom-end"
    },
    {
      target: ".tour-stats",
      content: "For Managers: Get a bird's-eye view of your organization. Track Active Pipeline, Conversion Rates, and identify Stagnant Leads that need attention.",
      placement: "bottom"
    },
    {
      target: ".tour-leaderboard",
      content: "Monitor top performing sales reps in real-time. The leaderboard updates dynamically as leads are converted.",
      placement: "top"
    }
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = ["finished", "skipped"];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem("gf_tour_completed", "true");
    }
  };

  if (!run) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      locale={{ skip: 'Skip Tutorial' }}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#9333ea",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "1rem",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        }
      }}
    />
  );
}

