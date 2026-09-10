const fs = require("fs");
let content = fs.readFileSync("src/lib/notificationManager.ts", "utf8");

const audioCode = `
const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "sine";
    // Nice soft notification "bloop"
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    // Ignore autoplay policy errors
  }
};
`;

content = content.replace("export const notifier = new NotificationManager();", audioCode + "\nexport const notifier = new NotificationManager();");

content = content.replace("toast(item.message, item.options);", "toast(item.message, item.options);\n        playNotificationSound();");

fs.writeFileSync("src/lib/notificationManager.ts", content);
console.log("Updated notificationManager.ts with Web Audio API sound");

