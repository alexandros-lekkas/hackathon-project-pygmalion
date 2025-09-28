import { NextRequest } from "next/server";
import { run } from "@openai/agents";
import { memoryAgent } from "@/lib/memory/agent";
import { z } from "zod";

// Request validation schema
const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = ChatRequestSchema.parse(body);

    console.log("🧠 Processing memory for message:", message);

    const conversationHistory = [
      ...history,
      { role: "user" as const, content: message },
    ];

    // Enable streaming with the memory agent
    const stream = await run(
      memoryAgent, 
      `process_user_message with userMessage: "${message}" and conversationContext: "${conversationHistory.slice(-3).map(h => `${h.role}: ${h.content}`).join('\n')}"`,
      { stream: true }
    );

    // Return streaming response
    return new Response(
      stream.toTextStream({ compatibleWithNodeStreams: true }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  } catch (error) {
    console.error("❌ Memory streaming failed:", error);
    return new Response(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      }
    );
  }
}