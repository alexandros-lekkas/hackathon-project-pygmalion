import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.TAVUS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "TAVUS_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://tavusapi.com/v2/conversations/${conversationId}/end`,
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Tavus API error! status: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error ending conversation:", error);
    return NextResponse.json(
      { error: "Failed to end conversation" },
      { status: 500 }
    );
  }
}
