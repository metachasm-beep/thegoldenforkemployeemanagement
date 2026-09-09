const fs = require("fs");

let sidebar = fs.readFileSync("src/components/chat/ChatSidebar.tsx", "utf8");
sidebar = sidebar.replace("className=\"w-80 border-r", "className=\"w-80 border-r chat-sidebar");
fs.writeFileSync("src/components/chat/ChatSidebar.tsx", sidebar);

let kanban = fs.readFileSync("src/app/components/LeadsKanban.tsx", "utf8");
kanban = kanban.replace("className=\"flex h-full", "className=\"flex h-full kanban-board");
fs.writeFileSync("src/app/components/LeadsKanban.tsx", kanban);

let profile = fs.readFileSync("src/app/components/ProfileAvatar.tsx", "utf8");
profile = profile.replace("className=\"relative", "className=\"relative user-profile-menu");
fs.writeFileSync("src/app/components/ProfileAvatar.tsx", profile);

