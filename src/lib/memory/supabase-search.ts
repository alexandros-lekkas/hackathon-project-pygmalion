import { createClient } from '@supabase/supabase-js';
import { Memory } from './types';

const supabaseUrl = 'https://nrjpsvswkjrnigajcron.supabase.co';

// Lazy initialization to avoid import-time errors
let supabase: any = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseKey = process.env.SUPABASE_KEY;
    if (!supabaseKey) {
      throw new Error('SUPABASE_KEY environment variable is required');
    }
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

/**
 * Set up PostgreSQL extensions and indexes for full text search and fuzzy matching
 * This should be run once during database initialization
 */
export async function setupSearchExtensions() {
  const client = getSupabaseClient();
  
  try {
    // Enable the pg_trgm extension for trigram similarity search
    await client.rpc('enable_pg_trgm');
    
    // Run function to create/update search_vector column if needed
    await client.rpc('setup_memory_search');
    
    console.log('✅ Search extensions set up successfully');
    return true;
  } catch (error) {
    console.error('Failed to set up search extensions:', error);
    return false;
  }
}

/**
 * Search memories using PostgreSQL full text search and trigram similarity
 * @param query Search query string
 * @param limit Maximum number of results to return
 * @returns Memories sorted by relevance score
 */
export async function searchMemories(query: string, limit: number = 5): Promise<Memory[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  const normalizedQuery = query.trim();
  const client = getSupabaseClient();
  
  try {
    // First try full text search with tsquery
    const { data: ftData, error: ftError } = await client.rpc('search_memories_full_text', {
      query_text: normalizedQuery,
      result_limit: limit
    });
    
    if (ftError) {
      console.error('Full text search error:', ftError);
    }
    
    // If full text search returns results, use them
    if (ftData && ftData.length > 0) {
      return ftData;
    }
    
    // Fall back to trigram similarity search
    const { data: trgData, error: trgError } = await client.rpc('search_memories_trigram', {
      query_text: normalizedQuery,
      result_limit: limit
    });
    
    if (trgError) {
      console.error('Trigram search error:', trgError);
      return [];
    }
    
    return trgData || [];
  } catch (error) {
    console.error('Memory search failed:', error);
    return [];
  }
}
