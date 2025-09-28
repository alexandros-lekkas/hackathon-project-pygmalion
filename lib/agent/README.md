# LiveKit Voice Agent Library

This library provides a modular, well-structured implementation of a LiveKit voice AI agent with support for multiple AI services.

## Structure

```
lib/agent/
├── index.ts          # Main entry point and agent definition
├── config.ts         # Configuration management and validation
├── session.ts        # Session management and voice pipeline setup
├── assistant.ts      # AI assistant class with tools and behavior
├── tools.ts          # Available tools (weather, time, calculator)
├── prewarm.ts        # Model prewarming and initialization
├── types.ts          # TypeScript type definitions
└── README.md         # This documentation
```

## Features

- **Modular Architecture**: Split into focused, single-responsibility modules
- **Multiple AI Services**: Support for OpenAI, Deepgram, ElevenLabs, and Silero
- **Built-in Tools**: Weather, time, and calculator tools
- **Noise Cancellation**: LiveKit Cloud enhanced noise cancellation
- **Metrics Collection**: Usage tracking and performance monitoring
- **Type Safety**: Full TypeScript support with comprehensive types
- **Error Handling**: Robust error handling and validation

## Required Environment Variables

```env
# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# Deepgram Configuration
DEEPGRAM_API_KEY=your_deepgram_api_key
DEEPGRAM_MODEL=nova-3

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id

# Optional Configuration
SILERO_ENABLED=true
```

## Usage

### Basic Usage

```typescript
import { defineAgent } from './lib/agent';

// The agent is already configured and ready to use
export default defineAgent({
  // Configuration is handled automatically
});
```

### Custom Tools

Add custom tools in `tools.ts`:

```typescript
export const myCustomTool = llm.tool({
  description: 'Description of what this tool does',
  parameters: z.object({
    param: z.string().describe('Parameter description'),
  }),
  execute: async ({ param }) => {
    // Tool implementation
    return 'Tool result';
  },
});
```

### Custom Assistant Behavior

Modify `assistant.ts` to customize the AI assistant's behavior:

```typescript
export class Assistant extends voice.Agent {
  constructor() {
    super({
      instructions: 'Your custom instructions here',
      tools: {
        // Your custom tools
      },
    });
  }

  async onUserMessage(message: string): Promise<void> {
    // Custom message handling
  }
}
```

## Running the Agent

### Development Mode
```bash
pnpm run dev
```

### Production Mode
```bash
pnpm run start
```

### Console Mode (for testing)
```bash
pnpm run console
```

## API Reference

### AgentSessionManager

Manages the voice agent session lifecycle.

- `createSession(ctx: JobContext)`: Creates a new agent session
- `startSession(ctx: JobContext)`: Starts the session and connects to room
- `generateGreeting()`: Generates an initial greeting
- `logUsage()`: Logs usage metrics
- `cleanup()`: Cleans up resources

### AgentPrewarm

Handles model prewarming and initialization.

- `prewarm(proc: JobProcess)`: Prewarms all required models
- `getVAD()`: Gets the VAD instance
- `cleanup()`: Cleans up prewarmed models

## Error Handling

The library includes comprehensive error handling:

- Configuration validation
- Service connection errors
- Tool execution errors
- Session lifecycle errors

All errors are logged with appropriate context and the agent gracefully handles failures.

## Performance

- Models are prewarmed for faster startup
- Usage metrics are collected for monitoring
- Memory is properly cleaned up on shutdown
- Noise cancellation improves audio quality
