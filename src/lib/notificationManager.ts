import { toast } from "sonner";

// Smart notification queue to prevent spamming
class NotificationManager {
  private queue: Array<{ message: string, options?: any }> = [];
  private isProcessing = false;
  private maxConsecutive = 3;
  private consecutiveCount = 0;
  private recentMessages = new Set<string>();

  enqueue(message: string, options?: any) {
    // Deduplicate exact same message arriving in same 2 seconds
    if (this.recentMessages.has(message)) return;
    
    this.recentMessages.add(message);
    setTimeout(() => this.recentMessages.delete(message), 2000);

    this.queue.push({ message, options });
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      if (this.consecutiveCount >= this.maxConsecutive) {
        // If we hit the limit, bundle the rest
        const remaining = this.queue.length;
        if (remaining > 0) {
          toast(`+${remaining} more new notifications...`);
          this.queue = [];
        }
        break;
      }

      const item = this.queue.shift();
      if (item) {
        toast(item.message, item.options);
        playNotificationSound();
        this.consecutiveCount++;
        await new Promise(resolve => setTimeout(resolve, 800)); // Delay between toasts
      }
    }

    this.isProcessing = false;
    setTimeout(() => {
      this.consecutiveCount = 0; // Reset consecutive counter after a pause
      this.processQueue();
    }, 3000);
  }
}


export const playNotificationSound = () => {
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
};

export const notifier = new NotificationManager();

