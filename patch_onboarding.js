const fs = require("fs");
let content = fs.readFileSync("src/components/Onboarding.tsx", "utf8");

content = content.replace(/const steps = \[[\s\S]*?\];/g, `const steps = [
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
  ];`);

fs.writeFileSync("src/components/Onboarding.tsx", content);
console.log("Updated Onboarding.tsx");

