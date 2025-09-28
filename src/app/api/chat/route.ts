import { NextRequest, NextResponse } from "next/server";
import { Agent, run } from "@openai/agents";

// Create a simple conversational agent
const agent = new Agent({
  name: "Assistant",
  instructions: `You are a helpful, friendly AI assistant. You can help users with:
- Answering questions
- Having conversations
- Providing information
- Helping with tasks
- Being a good listener

Be conversational, helpful, and engaging. Keep responses concise but informative. If you don't know something, say so honestly.`,
});

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Convert history to the format expected by the agent
    const inputItems = history?.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    })) || [];

    // Add the current message
    inputItems.push({
      role: "user",
      content: message,
    });

    // Run the agent with the conversation history
    const result = await run(agent, inputItems);

    return NextResponse.json({
      response: result.finalOutput,
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
