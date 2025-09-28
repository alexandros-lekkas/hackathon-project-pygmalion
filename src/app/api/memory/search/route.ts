import { NextRequest } from "next/server";
import { searchMemories } from "@/lib/memory/supabase-search";
import { z } from "zod";

// Request validation schema
const SearchRequestSchema = z.object({
  query: z.string().min(1, "Search query cannot be empty"),
  limit: z.number().optional().default(5)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit } = SearchRequestSchema.parse(body);

    console.log("🔍 Searching memories for:", query);
    
    const results = await searchMemories(query, limit);
    
    return Response.json({
      success: true,
      results
    });
  } catch (error) {
    console.error("❌ Memory search failed:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
