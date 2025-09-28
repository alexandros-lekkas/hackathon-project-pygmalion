import { NextRequest, NextResponse } from "next/server";
import type { IConversation } from "@/types/tavus";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.TAVUS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "TAVUS_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    const personaId = "p352c7fcf578";

    // First, check if the persona exists
    console.log("Checking if persona exists:", personaId);
    const personaCheckResponse = await fetch(
      `https://tavusapi.com/v2/personas/${personaId}`,
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
        },
      }
    );

    if (!personaCheckResponse.ok) {
      const errorText = await personaCheckResponse.text();
      console.error("Persona check failed:", errorText);
      throw new Error(
        `Persona check failed! status: ${personaCheckResponse.status}, message: ${errorText}`
      );
    }

    const personaData = await personaCheckResponse.json();
    console.log("Persona exists:", personaData);

    const requestBody = {
      persona_id: personaId,
    };

    console.log("Sending request to Tavus API:", {
      url: "https://tavusapi.com/v2/conversations",
      body: requestBody,
      hasApiKey: !!apiKey,
    });

    const response = await fetch("https://tavusapi.com/v2/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Tavus API error response:", errorText);
      throw new Error(
        `Tavus API error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data: IConversation = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
