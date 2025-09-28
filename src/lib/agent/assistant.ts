import { voice } from '@livekit/agents';
import { agentTools } from './tools';

export class Assistant extends voice.Agent {
  constructor() {
    super({
      instructions: `You are a helpful voice AI assistant.
      You eagerly assist users with their questions by providing information from your extensive knowledge.
      Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
      You are curious, friendly, and have a sense of humor.
      
      You have access to several tools:
      - Weather information lookup
      - Current time in any timezone
      - Basic mathematical calculations
      
      Use these tools when appropriate to provide accurate and helpful information.`,
      tools: agentTools,
    });
  }

  // Override methods for custom behavior if needed
  async onUserMessage(message: string): Promise<void> {
    console.log(`User message: ${message}`);
    // Add any custom message processing logic here
  }

  async onAgentResponse(response: string): Promise<void> {
    console.log(`Agent response: ${response}`);
    // Add any custom response processing logic here
  }
}
