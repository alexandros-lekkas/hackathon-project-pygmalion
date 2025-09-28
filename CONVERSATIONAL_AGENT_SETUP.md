# Conversational Agent Setup

This project now includes a basic conversational agent built with the OpenAI Agents SDK.

## Setup

1. **Environment Variables**: Create a `.env.local` file in the root directory with:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   TAVUS_API_KEY=your_tavus_api_key_here
   ```

2. **Install Dependencies**: The required packages are already installed:
   - `@openai/agents` - For the conversational agent
   - `zod` - For type validation

## Usage

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Access the conversational agent**:
   - Visit `http://localhost:3000/chat` for the chat interface
   - Or click "Start Chat" on the main page

## Features

- **Simple Chat Interface**: Clean, responsive chat UI
- **Conversation History**: Maintains context throughout the conversation
- **Real-time Messaging**: Send and receive messages instantly
- **Error Handling**: Graceful error handling for API failures
- **Auto-scroll**: Automatically scrolls to show new messages

## How It Works

The conversational agent uses the OpenAI Agents SDK with:

1. **Agent Configuration**: A simple agent with helpful instructions
2. **API Route**: `/api/chat` handles the conversation logic
3. **React Component**: `ChatAgent` provides the user interface
4. **Conversation History**: Maintains context by passing previous messages

## Customization

You can customize the agent by modifying:

- **Agent Instructions**: In `src/app/api/chat/route.ts`
- **UI Components**: In `src/components/chat-agent.tsx`
- **Styling**: Using Tailwind CSS classes

## Example Usage

The agent can help with:
- Answering questions
- Having conversations
- Providing information
- Helping with tasks
- Being a good listener

Just type your message and press Enter or click Send!
