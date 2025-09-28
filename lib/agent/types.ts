// Agent configuration types
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

// Tool response types
export interface ToolResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Agent session events
export enum AgentSessionEvents {
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended',
  USER_MESSAGE = 'user_message',
  AGENT_RESPONSE = 'agent_response',
  TOOL_EXECUTED = 'tool_executed',
  ERROR = 'error',
}

// Agent capabilities
export interface AgentCapabilities {
  hasWeatherTool: boolean;
  hasTimeTool: boolean;
  hasCalculatorTool: boolean;
  hasCustomTools: boolean;
}

// Voice settings
export interface VoiceSettings {
  voiceId: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

// Session metrics
export interface SessionMetrics {
  totalMessages: number;
  totalResponses: number;
  averageResponseTime: number;
  toolsUsed: Record<string, number>;
  errors: number;
}
