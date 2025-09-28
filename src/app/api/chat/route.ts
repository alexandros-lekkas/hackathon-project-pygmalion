import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processChatRequest, updateMemories } from "./service";
import { ChatRequest, ChatError } from "./types";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const chatRequest: ChatRequest = body;

    // Process the chat request using the service
    const response = await processChatRequest(chatRequest);

    //Basically, I want you to update the memories but the API should continue running and not await the updateMemories function
    updateMemories(chatRequest);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorResponse: ChatError = {
        error: "Invalid request format",
        details: error.errors,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Handle other errors
    const errorResponse: ChatError = {
      error: "Internal server error",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
