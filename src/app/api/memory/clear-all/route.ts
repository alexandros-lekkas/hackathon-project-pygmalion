import { NextResponse } from "next/server";
import { clearAllMemories } from "@/lib/memory/supabase-storage";

export async function POST() {
  try {
    console.log("🗑️ Clearing all memories from Supabase...");
    
    await clearAllMemories();

    return NextResponse.json({ 
      success: true,
      message: "All memories cleared successfully from Supabase" 
    });
  } catch (error) {
    console.error("Error clearing all memories:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to clear all memories",
        details: error instanceof Error ? error.message : "Unknown error" 
      }, 
      { status: 500 }
    );
  }
}
