import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteMemory } from "@/lib/memory/supabase-storage";

// Request validation schema
const DeleteMemorySchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title } = DeleteMemorySchema.parse(body);

    await deleteMemory(title);

    return NextResponse.json({ 
      success: true,
      message: `Memory "${title}" deleted successfully` 
    });
  } catch (error) {
    console.error("Error deleting memory:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete memory",
        details: error instanceof Error ? error.message : "Unknown error" 
      }, 
      { status: 500 }
    );
  }
}
