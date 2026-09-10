const fs = require("fs");
let content = fs.readFileSync("src/app/chat/ChatClient.tsx", "utf8");

// Change main chat window background
content = content.replace(/bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800/g, "spatial-glass rounded-2xl shadow-xl shadow-black/10 border-white/10 dark:border-white/10");

// Change sidebar chat items
content = content.replace(/hover:bg-gray-50 dark:hover:bg-gray-800/g, "hover:spatial-card");
content = content.replace(/bg-blue-50 dark:bg-blue-900\/20/g, "spatial-card !bg-blue-500/10");

// Change chat header
content = content.replace(/border-b border-gray-200 dark:border-gray-800 p-4/g, "border-b border-white/10 p-4 spatial-glass rounded-t-2xl");

// Change chat input area
content = content.replace(/border-t border-gray-200 dark:border-gray-800 p-4/g, "border-t border-white/10 p-4 spatial-glass rounded-b-2xl");

// Change text input
content = content.replace(/flex-1 bg-gray-100 dark:bg-gray-800 rounded-full/g, "flex-1 spatial-card rounded-full");
content = content.replace(/bg-transparent border-none/g, "bg-transparent border-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400");

// Change message bubbles (Sent)
content = content.replace(/bg-blue-500 text-white rounded-2xl rounded-tr-sm/g, "bg-blue-500/80 backdrop-blur-md text-white border border-white/20 rounded-2xl rounded-tr-sm shadow-md");

// Change message bubbles (Received)
content = content.replace(/bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm/g, "spatial-card text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm shadow-md");

fs.writeFileSync("src/app/chat/ChatClient.tsx", content);
console.log("Updated ChatClient.tsx");

