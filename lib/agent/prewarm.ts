import { type JobProcess } from '@livekit/agents';
import * as silero from '@livekit/agents-plugin-silero';

export class AgentPrewarm {
  private static vadInstance: silero.VAD | null = null;

  static async prewarm(proc: JobProcess): Promise<void> {
    try {
      console.log('Prewarming agent models...');
      
      // Load VAD model for voice activity detection
      if (!this.vadInstance) {
        console.log('Loading Silero VAD model...');
        this.vadInstance = await silero.VAD.load();
        console.log('Silero VAD model loaded successfully');
      }

      // Store VAD instance in process user data for reuse
      proc.userData.vad = this.vadInstance;

      console.log('Agent prewarm completed successfully');
    } catch (error) {
      console.error('Error during agent prewarm:', error);
      throw error;
    }
  }

  static getVAD(): silero.VAD | null {
    return this.vadInstance;
  }

  static async cleanup(): Promise<void> {
    if (this.vadInstance) {
      // Cleanup VAD instance if needed
      this.vadInstance = null;
    }
  }
}
