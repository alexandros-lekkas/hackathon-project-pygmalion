import { type JobContext, type JobProcess, WorkerOptions, cli, defineAgent } from '@livekit/agents';
import { fileURLToPath } from 'node:url';
import { getAgentConfig, validateConfig } from './config';
import { AgentSessionManager } from './session';
import { AgentPrewarm } from './prewarm';

// Load and validate configuration
let config: ReturnType<typeof getAgentConfig>;
try {
  console.log('🔧 Loading agent configuration...');
  config = getAgentConfig();
  if (!validateConfig(config)) {
    throw new Error('Invalid agent configuration');
  }
  console.log('✅ Agent configuration loaded successfully');
  console.log('📋 Config summary:', {
    livekitUrl: config.livekit.url,
    openaiModel: config.openai.model,
    deepgramModel: config.deepgram.model,
    elevenlabsVoiceId: config.elevenlabs.voiceId,
  });
} catch (error) {
  console.error('❌ Configuration error:', error);
  process.exit(1);
}

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    await AgentPrewarm.prewarm(proc);
  },
  
  entry: async (ctx: JobContext) => {
    try {
      console.log('🚀 Starting voice agent session...');
      console.log('🎯 Room name:', ctx.room.name);
      console.log('👥 Participants:', ctx.room.numParticipants);
      
      // Create session manager
      const sessionManager = new AgentSessionManager(config);
      
      // Create and start the session
      await sessionManager.createSession(ctx);
      await sessionManager.startSession(ctx);
      
      // Generate initial greeting
      await sessionManager.generateGreeting();
      
      // Set up cleanup on shutdown
      ctx.addShutdownCallback(async () => {
        console.log('🛑 Shutting down agent session...');
        await sessionManager.cleanup();
        console.log('✅ Agent session shutdown complete');
      });
      
      console.log('🎉 Voice agent session started successfully and ready to chat!');
      
    } catch (error) {
      console.error('❌ Error starting agent session:', error);
      throw error;
    }
  },
});

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  cli.runApp(new WorkerOptions({ 
    agent: fileURLToPath(import.meta.url) 
  }));
}
