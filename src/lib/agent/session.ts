import { type JobContext, voice, metrics } from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { AgentConfig } from './config';
import { Assistant } from './assistant';

export class AgentSessionManager {
  private session: voice.AgentSession | null = null;
  private usageCollector: metrics.UsageCollector;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.usageCollector = new metrics.UsageCollector();
  }

  async createSession(ctx: JobContext): Promise<voice.AgentSession> {
    console.log('🤖 Creating voice AI session...');
    console.log('📋 Configuration:', {
      openaiModel: this.config.openai.model,
      deepgramModel: this.config.deepgram.model,
      elevenlabsVoiceId: this.config.elevenlabs.voiceId,
    });

    // Create the voice AI pipeline
    this.session = new voice.AgentSession({
      // Large Language Model (LLM) - the agent's brain
      llm: new openai.LLM({ 
        model: this.config.openai.model,
        apiKey: this.config.openai.apiKey 
      }),
      
      // Speech-to-text (STT) - the agent's ears
      stt: new deepgram.STT({ 
        model: this.config.deepgram.model,
        apiKey: this.config.deepgram.apiKey 
      }),
      
      // Text-to-speech (TTS) - the agent's voice
      tts: new elevenlabs.TTS({
        voiceId: this.config.elevenlabs.voiceId,
        apiKey: this.config.elevenlabs.apiKey,
      }),
      
      // VAD and turn detection - determines when user is speaking
      turnDetection: new livekit.turnDetector.MultilingualModel(),
      vad: ctx.proc.userData.vad as silero.VAD,
    });

    console.log('✅ Voice AI session created successfully');

    // Set up metrics collection
    this.setupMetrics();

    return this.session;
  }

  private setupMetrics(): void {
    if (!this.session) return;

    console.log('📊 Setting up metrics collection...');
    this.session.on(voice.AgentSessionEventTypes.MetricsCollected, (ev) => {
      console.log('📈 Metrics collected:', ev.metrics);
      metrics.logMetrics(ev.metrics);
      this.usageCollector.collect(ev.metrics);
    });
  }

  async startSession(ctx: JobContext): Promise<void> {
    if (!this.session) {
      throw new Error('Session not created. Call createSession first.');
    }

    console.log('🚀 Starting voice AI session...');
    console.log('🎯 Room:', ctx.room.name);

    // Start the session with noise cancellation
    await this.session.start({
      agent: new Assistant(),
      room: ctx.room,
      inputOptions: {
        // LiveKit Cloud enhanced noise cancellation
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });

    console.log('✅ Voice AI session started successfully');

    // Connect to the room
    console.log('🔗 Connecting to room...');
    await ctx.connect();
    console.log('✅ Connected to room');
  }

  async generateGreeting(): Promise<void> {
    if (!this.session) {
      throw new Error('Session not started.');
    }

    console.log('👋 Generating greeting message...');
    await this.session.generate_reply(
      "Greet the user and offer your assistance. Be friendly and ask how you can help them today."
    );
    console.log('✅ Greeting generated and sent');
  }

  async logUsage(): Promise<void> {
    const summary = this.usageCollector.getSummary();
    console.log(`Usage Summary: ${JSON.stringify(summary, null, 2)}`);
  }

  getSession(): voice.AgentSession | null {
    return this.session;
  }

  async cleanup(): Promise<void> {
    if (this.session) {
      await this.logUsage();
      this.session = null;
    }
  }
}
