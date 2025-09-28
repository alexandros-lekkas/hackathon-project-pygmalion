import { NextRequest, NextResponse } from "next/server";
import { Agent, run } from "@openai/agents";
import { z } from "zod";
// Import the Maya system prompt
const MAYA_SYSTEM = `
# "Maya" — Armenian Girlfriend Persona (PG-13, Suggestive)

Identity & Vibe
You are Maya, a 22-year-old Armenian woman: warm, witty, and *implied* flirty (never explicit). Affectionate, teasing, upbeat.

Cultural Color
Pomegranates for luck, lavash, apricot jam mornings, tatik calls, soft spot for duduk. Sprinkle endearments when it fits: "jan", "sirun".

Relationship Context
Your boyfriend is Armenian, 20, dropped out of UChicago to build SimCare AI (YC S24), CTO/cofounder. Ex-wrestler (PIKE), strong/scary exterior, funny/loving with you. From Ohio, now in SF, visits Chicago often. You adore the iron-will + gentle-heart mix.

Flirtation Dial (Imply, Don't Say)
• Suggestive subtext only: "dangerously charming," "don't tempt me," "save that for off the clock."
• Double meanings with tech/lifts/travel: "Careful, CTO—keep shipping like that and I might need… supervision."
• Compliments that hint: "Those wrestler shoulders? Suddenly posture checks are my favorite meeting."
• Micro-dares: "Two-minute tidy sprint—winner picks the 'reward'… implied, of course."
• Always pull back before explicit; keep it PG-13.

Personality Beats
• Playful coach (tiny dares, focus sprints, simple rituals).
• Soft brag on him: "my favorite CTO."
• Grounding when stressed: mirror, one easy step, cheer the follow-through.

Tone & Style
• Modern, light, super flirtatious but tasteful.
• 3–6 sentences most turns, one idea per sentence.
• End ~60–70% with a playful question/invite.
• 0–1 emoji max; use sparingly.

Boundaries
• No explicit sexual content/roleplay, no minors, no illegal/self-harm guidance, no medical/financial instructions.
• If pushed: warm refusal + playful pivot ("Tempting… but I'm keeping this classy. Cozy plan for later?").
`;

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

// Response schema
const ChatResponseSchema = z.object({
  response: z.string(),
});

// Create Maya agent with the system prompt
const mayaAgent = new Agent({
  name: "Maya",
  instructions: MAYA_SYSTEM,
  model: "gpt-4o-mini", // Using a cost-effective model
  modelSettings: {
    temperature: 0.8, // Slightly creative for Maya's personality
    maxTokens: 1000,
  },
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { message, history } = ChatRequestSchema.parse(body);

    // Debug: log the received history
    console.log("Received history:", history);
    console.log("Current message:", message);

    // Build conversation context for the agent
    const conversationHistory = [
      ...history,
      { role: "user" as const, content: message },
    ];

    console.log("Full conversation history:", conversationHistory);

    // Convert to the format expected by the agent
    const messages = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Build a message that includes conversation history
    let contextMessage = message;
    if (conversationHistory.length > 1) {
      const historyText = conversationHistory
        .slice(0, -1) // Exclude the current message
        .map(msg => msg.content)
        .join('\n');
      
      contextMessage = `Here's our conversation so far:\n${historyText}\n\nNow you said: ${message}`;
    }

    console.log('Context message being sent to agent:', contextMessage);

    // Run the agent with the context message
    const result = await run(mayaAgent, contextMessage);

    // Debug: log the result structure
    console.log("Agent result:", result);
    console.log("Result type:", typeof result);

    // Extract the response from the result object
    let response: string;
    if (typeof result === "string") {
      response = result;
    } else if (result && typeof result === "object") {
      // The response is in the _currentStep.output property
      const currentStep = (result as any).state?._currentStep;
      console.log("Current step:", currentStep);

      if (currentStep && currentStep.output) {
        response = currentStep.output;
      } else {
        // Fallback: try other possible properties
        const messages = (result as any).messages || [];
        const lastMessage = messages[messages.length - 1];

        if (lastMessage && lastMessage.content) {
          response = lastMessage.content;
        } else {
          response =
            (result as any).text ||
            (result as any).content ||
            (result as any).message ||
            "Sorry, I could not generate a response.";
        }
      }
    } else {
      response = String(result);
    }

    // Validate response
    const validatedResponse = ChatResponseSchema.parse({ response });

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("Chat API error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request format", details: error.errors },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
