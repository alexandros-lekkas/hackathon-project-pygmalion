# Memory Agent System

A sophisticated memory management system built with OpenAI Agents SDK that allows conversational AI agents to store, retrieve, and manage persistent memories across conversations.

## Features

### Core Memory Operations
- **Add Memories**: Store important facts, preferences, and context
- **Search Memories**: Find relevant information using natural language queries
- **Update Memories**: Modify existing memories with new information
- **Delete Memories**: Remove outdated or incorrect information
- **Get All Memories**: Retrieve all stored memories with sorting options
- **Memory Statistics**: Get insights about your memory collection

### Advanced Features
- **Importance-based Filtering**: Filter memories by importance level (1-10)
- **Duplicate Prevention**: Prevents adding memories with duplicate titles
- **Data Validation**: Ensures data integrity and proper formatting
- **Error Handling**: Robust error handling with meaningful messages
- **File-based Storage**: Persistent JSON storage in `data/memories.json`

## Memory Type Structure

```typescript
export type Memory = {
  title: string;        // Brief title for the memory
  content: string;      // Detailed content of the memory
  importance: number;   // Importance level from 1-10
}
```

## Available Tools

### 1. `add_memory`
Adds a new memory to the store.
- **Parameters**: title, content, importance
- **Validation**: Prevents empty titles/content, duplicate titles
- **Returns**: Success status and the created memory

### 2. `search_memories`
Searches for memories by title or content.
- **Parameters**: query, minImportance (optional), maxResults (optional)
- **Features**: Case-insensitive search, importance filtering
- **Returns**: Matching memories sorted by importance

### 3. `get_all_memories`
Retrieves all stored memories.
- **Parameters**: sortBy (importance/title/content), order (asc/desc)
- **Returns**: All memories with sorting applied

### 4. `update_memory`
Updates an existing memory.
- **Parameters**: searchQuery, newTitle, newContent, newImportance
- **Features**: Finds memory by search query, updates specified fields
- **Returns**: Original and updated memory

### 5. `delete_memory`
Deletes a memory by search query.
- **Parameters**: searchQuery
- **Returns**: Confirmation and deleted memory details

### 6. `get_memory_stats`
Provides statistics about stored memories.
- **Returns**: Total count, average importance, distribution, etc.

### 7. `clear_all_memories`
Clears all memories (requires confirmation).
- **Parameters**: confirm (boolean)
- **Safety**: Requires explicit confirmation

### 8. `get_memories_by_importance`
Gets memories within a specific importance range.
- **Parameters**: minImportance, maxImportance, limit
- **Returns**: Filtered memories sorted by importance

## Usage Example

```typescript
import { run } from "@openai/agents";
import { memoryAgent } from "./agent";

// Add a memory
const result = await run(memoryAgent, "Remember that I prefer morning meetings");
console.log(result);

// Search memories
const searchResult = await run(memoryAgent, "What do you know about my meeting preferences?");
console.log(searchResult);
```

## Importance Scale Guide

- **1-3**: Casual preferences, minor details
- **4-6**: Important preferences, recurring themes, moderate context
- **7-8**: Critical information, strong preferences, important context
- **9-10**: Essential facts, deal-breakers, critical context for decision making

## File Structure

```
src/lib/memory/
├── agent.ts          # Memory agent configuration
├── tools.ts          # All memory manipulation tools
├── types.ts          # Memory type definitions
├── example.ts        # Usage examples
└── prompt.txt        # Agent instructions

data/
└── memories.json     # Persistent memory storage
```

## Error Handling

The system includes comprehensive error handling:
- File system errors (missing files, permission issues)
- Data validation errors (invalid JSON, malformed data)
- Business logic errors (duplicate titles, invalid importance levels)
- Graceful degradation (returns empty arrays on errors)

## Security Considerations

- Input validation prevents malicious data injection
- File operations are contained within the data directory
- No external API calls or data transmission
- Local file-based storage for privacy

## Future Enhancements

- Memory categorization/tagging
- Memory import/export functionality
- Advanced search with semantic similarity
- Memory sharing between different agents
