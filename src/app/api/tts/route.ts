import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateSpeech } from "./tts";

// Request validation schema
const TTSRequestSchema = z.object({
  text: z.string().min(1, "Text cannot be empty"),
  voiceId: z.string().optional(),
});

// Response schema
const TTSResponseSchema = z.object({
  audioUrl: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { text, voiceId } = TTSRequestSchema.parse(body);

    // Generate speech using the TTS service
    const ttsResult = await generateSpeech(text, voiceId);

    // Validate response
    const validatedResponse = TTSResponseSchema.parse(ttsResult);

    if (!ttsResult.success) {
      return NextResponse.json(validatedResponse, { status: 400 });
    }

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("TTS API error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorResponse = {
        audioUrl: "",
        success: false,
        error: "Invalid request format",
        details: error.errors,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Handle other errors
    const errorResponse = {
      audioUrl: "",
      success: false,
      error: "Internal server error",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
