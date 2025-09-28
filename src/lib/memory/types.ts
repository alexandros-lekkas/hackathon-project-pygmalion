export type Memory = {
  id: number;
  title: string;
  content: string;
  importance: number;
  score?: number; // Score from search results, only present when returned from search
}