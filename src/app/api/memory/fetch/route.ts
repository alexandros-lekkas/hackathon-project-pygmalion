import { NextResponse } from "next/server";
import { readMemories } from "@/lib/memory/supabase-storage";

export async function GET() {
  try {
    const memories = await readMemories();
    return NextResponse.json({ 
      success: true, 
      memories 
    });
  } catch (error) {
    console.error("Error fetching memories:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch memories" 
      }, 
      { status: 500 }
    );
  }
}
