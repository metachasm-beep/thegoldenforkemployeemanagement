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

export const notifier = new NotificationManager();

