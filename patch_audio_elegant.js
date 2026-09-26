const fs = require("fs");
let content = fs.readFileSync("src/lib/notificationManager.ts", "utf8");

const oldAudio = `export const playNotificationSound = () => {
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
};`;

const newAudio = `export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playNote = (frequency: number, startTime: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, startTime);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    
    // E5 (main) + E4 (sub-harmonic for richness)
    playNote(659.25, now, 0.8, 0.4); 
    playNote(329.63, now, 0.8, 0.1); 

    // A5 (main) + A4 (sub-harmonic)
    playNote(880.00, now + 0.15, 1.4, 0.5); 
    playNote(440.00, now + 0.15, 1.4, 0.15); 
    
  } catch (e) {
    // Ignore autoplay policy errors
  }
};`;

content = content.replace(oldAudio, newAudio);
fs.writeFileSync("src/lib/notificationManager.ts", content);
console.log("Updated notification audio");

