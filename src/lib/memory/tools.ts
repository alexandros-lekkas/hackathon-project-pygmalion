import { tool } from "@openai/agents";
import { z } from "zod";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { Memory } from "./types";

// Path to the memory JSON file
const MEMORY_FILE_PATH = join(process.cwd(), "data", "memories.json");

// Helper function to read memories from file
function readMemories(): Memory[] {
  try {
    if (!existsSync(MEMORY_FILE_PATH)) {
      return [];
    }
    const data = readFileSync(MEMORY_FILE_PATH, "utf-8");
    const parsed = JSON.parse(data);
    
    // Validate that parsed data is an array
    if (!Array.isArray(parsed)) {
      console.warn("Memory file contains invalid data, initializing empty array");
      return [];
    }
    
    // Validate each memory object
    return parsed.filter((memory: any) => {
      return memory && 
             typeof memory.title === 'string' && 
             typeof memory.content === 'string' && 
             typeof memory.importance === 'number' &&
             memory.importance >= 1 && 
             memory.importance <= 10;
    });
  } catch (error) {
    console.error("Error reading memories:", error);
    return [];
  }
}

// Helper function to write memories to file
function writeMemories(memories: Memory[]): void {
  writeFileSync(MEMORY_FILE_PATH, JSON.stringify(memories, null, 2));
}

// Helper function to generate a unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Function to add or update a memory
function addOrUpdateMemory(title: string, content: string, importance: number) {
  const memories = readMemories();
  
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
    return {
      success: true,
      message: `Memory "${title}" has been updated successfully`,
      memory
    };
  } else {
    // Add new memory
    memories.push(memory);
    writeMemories(memories);
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
function getAllMemoriesSorted(sortBy: string = "importance", order: string = "desc") {
  const memories = readMemories();
  
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
    sortBy: z.enum(["importance", "title", "content"]).optional().describe("Sort memories by importance, title, or content"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order: ascending or descending")
  }),
  async execute({ sortBy = "importance", order = "desc" }) {
    return getAllMemoriesSorted(sortBy, order);
  }
});

// Function to search memories
function searchMemoriesByQuery(query: string, minImportance?: number, maxResults: number = 10) {
  const memories = readMemories();
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
    minImportance: z.number().min(1).max(10).optional().describe("Minimum importance level filter"),
    maxResults: z.number().min(1).max(50).optional().describe("Maximum number of results to return")
  }),
  async execute({ query, minImportance, maxResults = 10 }) {
    return searchMemoriesByQuery(query, minImportance, maxResults);
  }
});

// Function to update a memory
function updateMemoryBySearch(searchQuery: string, newTitle?: string, newContent?: string, newImportance?: number) {
  const memories = readMemories();
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
  writeMemories(memories);
  
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
    newTitle: z.string().optional().describe("New title for the memory"),
    newContent: z.string().optional().describe("New content for the memory"),
    newImportance: z.number().min(1).max(10).optional().describe("New importance level")
  }),
  async execute({ searchQuery, newTitle, newContent, newImportance }) {
    return updateMemoryBySearch(searchQuery, newTitle, newContent, newImportance);
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
      const memories = readMemories();
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
      writeMemories(memories);
      
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
      
      const memories = readMemories();
      const count = memories.length;
      
      writeMemories([]);
      
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
    limit: z.number().min(1).max(100).optional().describe("Maximum number of results")
  }),
  async execute({ minImportance, maxImportance, limit = 50 }) {
    try {
      const memories = readMemories();
      
      const filteredMemories = memories.filter(memory => 
        memory.importance >= minImportance && memory.importance <= maxImportance
      );
      
      const sortedMemories = filteredMemories
        .sort((a, b) => b.importance - a.importance)
        .slice(0, limit);
      
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

// Function to process user messages and update memories
function processUserMessageForMemory(userMessage: string, conversationContext: string = "") {
  const memories = readMemories();
  const message = userMessage.toLowerCase();
  
  // Look for patterns that indicate memory updates
  const updatePatterns = [
    /(?:actually|correction|wrong|mistake|not|don't|doesn't|didn't|wasn't|weren't|isn't|aren't)/,
    /(?:now i|i now|changed my mind|i prefer|i like|i don't like|i hate)/,
    /(?:remember|note|important|keep in mind|for future|my name is|i am|i work|i live|my favorite)/,
    /(?:update|change|modify|instead of|rather than)/
  ];
  
  let actionsTaken: string[] = [];
  let updatedMemories: Memory[] = [];
  let newMemories: Memory[] = [];
  
  const isUpdate = updatePatterns.some(pattern => pattern.test(message));
  
  if (isUpdate) {
    // Try to find existing memories that might need updating
    const relevantMemories = memories.filter(memory => {
      const memoryText = `${memory.title} ${memory.content}`.toLowerCase();
      const messageWords = message.split(/\s+/);
      const memoryWords = memoryText.split(/\s+/);
      const commonWords = messageWords.filter(word => 
        word.length > 3 && memoryWords.includes(word)
      );
      return commonWords.length > 0;
    });
    
    if (relevantMemories.length > 0) {
      for (const memory of relevantMemories) {
        const memoryIndex = memories.findIndex(m => m.title === memory.title);
        if (memoryIndex !== -1) {
          const updatedContent = `${memory.content}\n\nUpdated: ${userMessage}`;
          memories[memoryIndex] = {
            ...memory,
            content: updatedContent,
            importance: Math.min(10, memory.importance + 1)
          };
          updatedMemories.push(memories[memoryIndex]);
          actionsTaken.push(`Updated memory: "${memory.title}"`);
        }
      }
    } else {
      const newMemory: Memory = {
        title: `User Update: ${new Date().toLocaleDateString()}`,
        content: `User message: ${userMessage}\nContext: ${conversationContext}`,
        importance: 6
      };
      memories.push(newMemory);
      newMemories.push(newMemory);
      actionsTaken.push(`Created new memory for user update`);
    }
  } else {
    // Check if this contains important information worth storing
    const importantPatterns = [
      /(?:my name is|i am|i work|i live|my favorite|i love|i hate|i prefer)/,
      /(?:remember|important|note|keep in mind)/,
      /(?:my (?:phone|email|address|birthday|age))/,
      /(?:i have|i own|i drive|i use)/
    ];
    
    const isImportant = importantPatterns.some(pattern => pattern.test(message));
    
    if (isImportant) {
      const newMemory: Memory = {
        title: `User Info: ${new Date().toLocaleDateString()}`,
        content: `User message: ${userMessage}\nContext: ${conversationContext}`,
        importance: 7
      };
      memories.push(newMemory);
      newMemories.push(newMemory);
      actionsTaken.push(`Created new memory for important information`);
    }
  }
  
  // Save changes if any were made
  if (updatedMemories.length > 0 || newMemories.length > 0) {
    writeMemories(memories);
  }
  
  return {
    success: true,
    actionsTaken,
    updatedMemories,
    newMemories,
    totalMemories: memories.length
  };
}

// Tool to automatically process user messages and update memories
export const processUserMessage = tool({
  name: "process_user_message",
  description: "Automatically analyze a user message and update relevant memories or create new ones",
  parameters: z.object({
    userMessage: z.string().describe("The user's message to process"),
    conversationContext: z.string().optional().describe("Additional context from the conversation")
  }),
  async execute({ userMessage, conversationContext = "" }) {
    return processUserMessageForMemory(userMessage, conversationContext);
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
