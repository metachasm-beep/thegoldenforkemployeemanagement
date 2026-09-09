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
      content: "Welcome to the Golden Fork Employee Management System! Let's take a quick tour.",
      disableBeacon: true,
      placement: "bottom"
    },
    {
      target: ".kanban-board",
      content: "Here is your Sales Pipeline. You can drag and drop leads across columns as they progress.",
      placement: "top"
    },
    {
      target: ".chat-sidebar",
      content: "Stay in sync with your team using the internal chat. You can pin conversations and share rich media here.",
      placement: "right"
    },
    {
      target: ".user-profile-menu",
      content: "Access your settings, download your paystubs, or log out from here.",
      placement: "bottom-end"
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

