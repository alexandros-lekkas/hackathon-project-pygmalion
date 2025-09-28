import { Memory } from './types';
import { searchMemories as searchMemoriesInDB } from './supabase-search';

/**
 * Search memories for relevant context based on a query
 * @param memories Array of memories to search through (for fallback)
 * @param query The user's query to find relevant memories for
 * @returns Most relevant memories, sorted by relevance
 */
export async function searchMemoriesByRelevance(
  memories: Memory[],
  query: string,
  maxResults: number = 3
): Promise<Memory[]> {
  if (!query) {
    return [];
  }

  try {
    // First try database search for best results
    const dbResults = await searchMemoriesInDB(query, maxResults);
    
    // If we got results from the database, return those
    if (dbResults && dbResults.length > 0) {
      return dbResults;
    }
    
    // Fallback to in-memory search if DB search returns no results
    return searchMemoriesInMemory(memories, query, maxResults);
  } catch (error) {
    console.error('Database search failed, falling back to in-memory search:', error);
    return searchMemoriesInMemory(memories, query, maxResults);
  }
}

/**
 * Legacy in-memory search as fallback
 * @private
 */
function searchMemoriesInMemory(
  memories: Memory[],
  query: string,
  maxResults: number = 3
): Memory[] {
  if (!memories || memories.length === 0 || !query) {
    return [];
  }

  // Normalize the query
  const normalizedQuery = query.toLowerCase().trim();
  const queryTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 3);
  
  // Score each memory based on relevance to the query
  const scoredMemories = memories.map(memory => {
    let score = 0;
    const normalizedTitle = memory.title.toLowerCase();
    const normalizedContent = memory.content.toLowerCase();
    
    // Direct matches in title are highly relevant
    if (normalizedTitle.includes(normalizedQuery)) {
      score += 10;
    }
    
    // Direct matches in content are relevant
    if (normalizedContent.includes(normalizedQuery)) {
      score += 5;
    }
    
    // Check for individual term matches
    for (const term of queryTerms) {
      if (normalizedTitle.includes(term)) {
        score += 2;
      }
      if (normalizedContent.includes(term)) {
        score += 1;
      }
    }
    
    // Boost by importance
    score *= (memory.importance / 5);
    
    return { memory, score };
  });
  
  // Filter out irrelevant memories and sort by score
  return scoredMemories
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.memory);
}
