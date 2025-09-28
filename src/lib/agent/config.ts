import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export interface AgentConfig {
  livekit: {
    url: string;
    apiKey: string;
    apiSecret: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
  deepgram: {
    apiKey: string;
    model: string;
  };
  elevenlabs: {
    apiKey: string;
    voiceId: string;
  };
  silero: {
    enabled: boolean;
  };
}

export const getAgentConfig = (): AgentConfig => {
  const config: AgentConfig = {
    livekit: {
      url: process.env.LIVEKIT_URL || '',
      apiKey: process.env.LIVEKIT_API_KEY || '',
      apiSecret: process.env.LIVEKIT_API_SECRET || '',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    deepgram: {
      apiKey: process.env.DEEPGRAM_API_KEY || '',
      model: process.env.DEEPGRAM_MODEL || 'nova-3',
    },
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      voiceId: process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB', // Default Adam voice
    },
    silero: {
      enabled: process.env.SILERO_ENABLED !== 'false',
    },
  };

  // Validate required configuration
  const requiredFields = [
    'LIVEKIT_URL',
    'LIVEKIT_API_KEY', 
    'LIVEKIT_API_SECRET',
    'OPENAI_API_KEY',
    'DEEPGRAM_API_KEY',
    'ELEVENLABS_API_KEY'
  ];

  const missingFields = requiredFields.filter(field => !process.env[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required environment variables: ${missingFields.join(', ')}`);
  }

  return config;
};

export const validateConfig = (config: AgentConfig): boolean => {
  return !!(
    config.livekit.url &&
    config.livekit.apiKey &&
    config.livekit.apiSecret &&
    config.openai.apiKey &&
    config.deepgram.apiKey &&
    config.elevenlabs.apiKey
  );
};
