import { Memory } from './types';

/**
 * Search memories for relevant context based on a query
 * @param memories Array of memories to search through
 * @param query The user's query to find relevant memories for
 * @returns Most relevant memories, sorted by relevance
 */
export function searchMemoriesByRelevance(
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
