import { NextRequest, NextResponse } from "next/server";
import { updateMemories } from "./service";
import { ChatRequest } from "./type";

export async function POST(request: NextRequest) {
  const chatRequest: ChatRequest = await request.json();
  const response = await updateMemories(chatRequest);
  return NextResponse.json(response);
}