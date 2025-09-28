import { run } from "@openai/agents";
import { memoryAgent } from "./agent";

// Example usage of the memory agent
async function exampleUsage() {
  // Add a memory
  const addResult = await run(memoryAgent, "Add a memory: My favorite color is blue, importance level 7");
  console.log("Add memory result:", addResult);

  // Search for memories
  const searchResult = await run(memoryAgent, "Search for memories about colors");
  console.log("Search result:", searchResult);

  // Get all memories
  const allMemoriesResult = await run(memoryAgent, "Show me all my memories");
  console.log("All memories:", allMemoriesResult);

  // Get memory statistics
  const statsResult = await run(memoryAgent, "What are the statistics of my memories?");
  console.log("Memory stats:", statsResult);
}

export { exampleUsage };
