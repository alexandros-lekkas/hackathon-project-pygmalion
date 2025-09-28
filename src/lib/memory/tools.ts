import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import { Memory } from "./types";
import { readMemories, writeMemories, logMemories, addMemory as addMemoryToSupabase, updateMemory as updateMemoryInSupabase } from "./supabase-storage";

// Helper function to generate a unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Function to add or update a memory
async function addOrUpdateMemory(title: string, content: string, importance: number) {
  const memories = await readMemories();
  
  // Check if title already exists
  const existingIndex = memories.findIndex(memory => 
    memory.title.toLowerCase() === title.toLowerCase()
  );
  
  const memory: Memory = {
    title: title.trim(),
    content: content.trim(),
    importance
  };
  
  if (existingIndex !== -1) {
    // Update existing memory
    memories[existingIndex] = memory;
    await writeMemories(memories);
    return {
      success: true,
      message: `Memory "${title}" has been updated successfully`,
      memory
    };
  } else {
    // Add new memory
    memories.push(memory);
    await writeMemories(memories);
    return {
      success: true,
      message: `Memory "${title}" has been added successfully`,
      memory
    };
  }
}

// Tool to add a new memory
export const addMemory = tool({
  name: "add_memory",
  description: "Add a new memory/fact to the conversation memory store",
  parameters: z.object({
    title: z.string().min(1).max(200).describe("A brief title for the memory"),
    content: z.string().min(1).max(2000).describe("The detailed content of the memory"),
    importance: z.number().min(1).max(10).describe("Importance level from 1-10 (10 being most important)")
  }),
  async execute({ title, content, importance }) {
    return addOrUpdateMemory(title, content, importance);
  }
});

// Function to get all memories
async function getAllMemoriesSorted(sortBy: string = "importance", order: string = "desc") {
  const memories = await readMemories();
  
  const sortedMemories = [...memories].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "importance":
        comparison = a.importance - b.importance;
        break;
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "content":
        comparison = a.content.localeCompare(b.content);
        break;
    }
    return order === "asc" ? comparison : -comparison;
  });
  
  return {
    success: true,
    memories: sortedMemories,
    count: sortedMemories.length
  };
}

// Tool to get all memories
export const getAllMemories = tool({
  name: "get_all_memories",
  description: "Retrieve all stored memories",
  parameters: z.object({
    sortBy: z.enum(["importance", "title", "content"]).nullable().describe("Sort memories by importance, title, or content"),
    order: z.enum(["asc", "desc"]).nullable().describe("Sort order: ascending or descending")
  }),
  async execute({ sortBy = "importance", order = "desc" }) {
    return getAllMemoriesSorted(sortBy || "importance", order || "desc");
  }
});

// Function to search memories
async function searchMemoriesByQuery(query: string, minImportance?: number, maxResults: number = 10) {
  const memories = await readMemories();
  const searchQuery = query.toLowerCase();
  
  const filteredMemories = memories.filter(memory => {
    const matchesQuery = memory.title.toLowerCase().includes(searchQuery) || 
                       memory.content.toLowerCase().includes(searchQuery);
    const matchesImportance = minImportance ? memory.importance >= minImportance : true;
    return matchesQuery && matchesImportance;
  });
  
  const sortedMemories = filteredMemories
    .sort((a, b) => b.importance - a.importance)
    .slice(0, maxResults);
  
  return {
    success: true,
    memories: sortedMemories,
    count: sortedMemories.length,
    totalFound: filteredMemories.length
  };
}

// Tool to search memories
export const searchMemories = tool({
  name: "search_memories",
  description: "Search for memories by title or content",
  parameters: z.object({
    query: z.string().describe("Search query to find relevant memories"),
    minImportance: z.number().min(1).max(10).nullable().describe("Minimum importance level filter"),
    maxResults: z.number().min(1).max(50).nullable().describe("Maximum number of results to return")
  }),
  async execute({ query, minImportance, maxResults = 10 }) {
    return searchMemoriesByQuery(query, minImportance || undefined, maxResults || 10);
  }
});

// Function to update a memory
async function updateMemoryBySearch(searchQuery: string, newTitle?: string, newContent?: string, newImportance?: number) {
  const memories = await readMemories();
  const searchQueryLower = searchQuery.toLowerCase();
  
  const memoryIndex = memories.findIndex(memory => 
    memory.title.toLowerCase().includes(searchQueryLower) || 
    memory.content.toLowerCase().includes(searchQueryLower)
  );
  
  if (memoryIndex === -1) {
    return {
      success: false,
      message: `No memory found matching "${searchQuery}"`
    };
  }
  
  const originalMemory = memories[memoryIndex];
  const updatedMemory: Memory = {
    title: newTitle ?? originalMemory.title,
    content: newContent ?? originalMemory.content,
    importance: newImportance ?? originalMemory.importance
  };
  
  memories[memoryIndex] = updatedMemory;
  await writeMemories(memories);
  
  return {
    success: true,
    message: `Memory updated successfully`,
    originalMemory,
    updatedMemory
  };
}

// Tool to update a memory
export const updateMemory = tool({
  name: "update_memory",
  description: "Update an existing memory by searching for it and replacing it",
  parameters: z.object({
    searchQuery: z.string().describe("Search query to find the memory to update"),
    newTitle: z.string().nullable().describe("New title for the memory"),
    newContent: z.string().nullable().describe("New content for the memory"),
    newImportance: z.number().min(1).max(10).nullable().describe("New importance level")
  }),
  async execute({ searchQuery, newTitle, newContent, newImportance }) {
    return updateMemoryBySearch(searchQuery, newTitle || undefined, newContent || undefined, newImportance || undefined);
  }
});

// Tool to delete a memory
export const deleteMemory = tool({
  name: "delete_memory",
  description: "Delete a memory by searching for it",
  parameters: z.object({
    searchQuery: z.string().describe("Search query to find the memory to delete")
  }),
  async execute({ searchQuery }) {
    try {
      const memories = await readMemories();
      const searchQueryLower = searchQuery.toLowerCase();
      
      // Find the memory to delete
      const memoryIndex = memories.findIndex(memory => 
        memory.title.toLowerCase().includes(searchQueryLower) || 
        memory.content.toLowerCase().includes(searchQueryLower)
      );
      
      if (memoryIndex === -1) {
        return {
          success: false,
          message: `No memory found matching "${searchQuery}"`
        };
      }
      
      // Remove the memory
      const deletedMemory = memories.splice(memoryIndex, 1)[0];
      await writeMemories(memories);
      
      return {
        success: true,
        message: `Memory "${deletedMemory.title}" has been deleted successfully`,
        deletedMemory
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete memory: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
});

// Tool to clear all memories
export const clearAllMemories = tool({
  name: "clear_all_memories",
  description: "Clear all stored memories (use with caution)",
  parameters: z.object({
    confirm: z.boolean().describe("Must be true to confirm clearing all memories")
  }),
  async execute({ confirm }) {
    try {
      if (!confirm) {
        return {
          success: false,
          message: "Confirmation required to clear all memories"
        };
      }
      
      const memories = await readMemories();
      const count = memories.length;
      
      await writeMemories([]);
      
      return {
        success: true,
        message: `All ${count} memories have been cleared successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to clear memories: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
});

// Tool to get memories by importance range
export const getMemoriesByImportance = tool({
  name: "get_memories_by_importance",
  description: "Get memories within a specific importance range",
  parameters: z.object({
    minImportance: z.number().min(1).max(10).describe("Minimum importance level"),
    maxImportance: z.number().min(1).max(10).describe("Maximum importance level"),
    limit: z.number().min(1).max(100).nullable().describe("Maximum number of results")
  }),
  async execute({ minImportance, maxImportance, limit = 50 }) {
    try {
      const memories = await readMemories();
      
      const filteredMemories = memories.filter(memory => 
        memory.importance >= minImportance && memory.importance <= maxImportance
      );
      
      const sortedMemories = filteredMemories
        .sort((a, b) => b.importance - a.importance)
        .slice(0, limit || 50);
      
      return {
        success: true,
        memories: sortedMemories,
        count: sortedMemories.length,
        totalFound: filteredMemories.length,
        importanceRange: { minImportance, maxImportance }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get memories by importance: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
});

// Function to process user messages using LLM extraction and persist to Supabase
async function processUserMessageForMemory(userMessage: string, conversationContext: string = "") {
  try {
    const extractionAgent = new Agent({
      name: "Memory Extractor",
      instructions: `
You extract concise, storable memories from chat messages.

Return ONLY JSON. Shape:
{
  "shouldSave": boolean,
  "title": string,          // very short label
  "content": string,        // 1-2 sentences summarizing the important fact
  "importance": number      // integer 1-10
}

Rules:
- Save only if the message provides a durable fact, preference, plan, or correction useful later.
- Title must be specific and scannable (≤ 80 chars).
- Content should be self-contained, without filler, no markdown.
- Importance guide: 1-3 minor, 4-6 recurring preference/context, 7-8 important, 9-10 critical.
      `,
      model: "gpt-4o-mini",
    });

    const input = `Message: ${userMessage}\nContext: ${conversationContext}`;
    const rawResult = await run(extractionAgent, input);

    // Normalize result to string
    let textResult: string;
    if (typeof rawResult === "string") {
      textResult = rawResult;
    } else if (rawResult && typeof rawResult === "object") {
      const currentStep = (rawResult as any).state?._currentStep;
      if (currentStep && currentStep.output) {
        textResult = currentStep.output;
      } else {
        const messages = (rawResult as any).messages || [];
        const lastMessage = messages[messages.length - 1];
        textResult = lastMessage?.content ?? JSON.stringify(rawResult);
      }
    } else {
      textResult = String(rawResult);
    }

    // Attempt to parse JSON from the model output
    let parsed: any = null;
    try {
      // Extract first JSON object in text
      const match = textResult.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : JSON.parse(textResult);
    } catch {
      parsed = null;
    }

    const ExtractionSchema = z.object({
      shouldSave: z.boolean().default(false),
      title: z.string().default("").transform((s) => s.trim()),
      content: z.string().default("").transform((s) => s.trim()),
      importance: z
        .number()
        .int()
        .min(1)
        .max(10)
        .default(5),
    });

    const safe = (() => {
      if (!parsed || typeof parsed !== "object") {
        return { shouldSave: false, title: "", content: "", importance: 5 };
      }
      const result = ExtractionSchema.safeParse(parsed);
      return result.success ? result.data : { shouldSave: false, title: "", content: "", importance: 5 };
    })();

    const actionsTaken: string[] = [];
    const updatedMemories: Memory[] = [];
    const newMemories: Memory[] = [];

    if (safe.shouldSave && safe.title && safe.content) {
      // Check for existing memory with same title (case-insensitive)
      const existing = (await readMemories()).find(
        (m) => m.title.toLowerCase() === safe.title.toLowerCase()
      );

      const memory: Memory = {
        title: safe.title,
        content: safe.content,
        importance: Math.max(1, Math.min(10, Math.round(safe.importance))),
      };

      if (existing) {
        await updateMemoryInSupabase(existing.title, memory);
        updatedMemories.push({ ...existing, ...memory });
        actionsTaken.push(`Updated memory: "${memory.title}"`);
      } else {
        await addMemoryToSupabase(memory);
        newMemories.push(memory);
        actionsTaken.push(`Added memory: "${memory.title}"`);
      }
    } else {
      actionsTaken.push("No durable memory to save");
    }

    const totalMemories = (await readMemories()).length;

    return {
      success: true,
      actionsTaken,
      updatedMemories,
      newMemories,
      totalMemories,
      extractorOutput: parsed ?? textResult,
    };
  } catch (error) {
    return {
      success: false,
      message: `Memory extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Tool to automatically process user messages and update memories
export const processUserMessage = tool({
  name: "process_user_message",
  description: "Automatically analyze a user message and update relevant memories or create new ones",
  parameters: z.object({
    userMessage: z.string().describe("The user's message to process"),
    conversationContext: z.string().nullable().describe("Additional context from the conversation")
  }),
  async execute({ userMessage, conversationContext = "" }) {
    return processUserMessageForMemory(userMessage, conversationContext || "");
  }
});

// Export all tools as an array for easy use
export const memoryTools = [
  addMemory,
  getAllMemories,
  searchMemories,
  updateMemory,
  deleteMemory,
  clearAllMemories,
  getMemoriesByImportance,
  processUserMessage
];
