"use client";

import { MemorySearchColumn } from "@/components/layout/memory-search-column";
import { useChatContext } from "@/lib/providers/chat-provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function Memory() {
  const { 
    isSearchingMemories,
    searchQuery,
    searchResults
  } = useChatContext();

  return (
    <MemorySearchColumn isSearching={isSearchingMemories}>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 mb-4">
          <h2 className="text-lg font-semibold">Memory</h2>
          <p className="text-sm text-muted-foreground">
            Memory search & retrieval
          </p>
        </div>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full mr-3">
            {/* Memory Search Process */}
            {isSearchingMemories && (
              <div className="mb-4 bg-purple-50/30 rounded-lg border border-purple-200 p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                    <span className="font-semibold text-purple-700">Searching Memories</span>
                  </div>
                </div>
                <div className="text-sm font-mono text-purple-700 whitespace-pre-wrap bg-white/50 p-3 rounded border border-purple-100 min-h-[60px]">
                  {`Query: "${searchQuery}"\nSearching through memory database...`}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Found {searchResults.length} relevant memories</h3>
                
                {searchResults.map((memory, index) => (
                  <div 
                    key={index}
                    className={`rounded-lg p-3 shadow-sm border-l-4 ${
                      memory.importance >= 8 ? 'border-l-red-500 bg-red-50/30' :
                      memory.importance >= 6 ? 'border-l-orange-500 bg-orange-50/30' :
                      memory.importance >= 4 ? 'border-l-purple-500 bg-purple-50/30' :
                      'border-l-gray-500 bg-gray-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {memory.importance >= 8 ? '🔴' :
                           memory.importance >= 6 ? '🟠' :
                           memory.importance >= 4 ? '🟣' : '⚪'}
                        </span>
                        <h4 className="font-medium text-sm text-gray-900">
                          {memory.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Match: {memory.score}%
                        </Badge>
                        <Badge 
                          variant={memory.importance >= 7 ? "destructive" : memory.importance >= 4 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {memory.importance}/10
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 mt-2 pt-2 border-t border-gray-200">
                      {memory.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Empty State */}
            {!isSearchingMemories && searchResults.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No memory search active</p>
                <p className="text-xs text-gray-400">Send a message to search memories</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </MemorySearchColumn>
  );
}
