"use client";

import { MemoryColumn } from "@/components/layout/memory-column";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useChatContext } from "@/lib/providers/chat-provider";

export default function Storage() {
  const { 
    memories, 
    isProcessingMemory: isProcessing, 
    memoryStreamingText: streamingText,
    memorySteps 
  } = useChatContext();

  return (
    <MemoryColumn isProcessing={isProcessing}>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 mb-4">
          <h2 className="text-lg font-semibold">Storage</h2>
          <p className="text-sm text-muted-foreground">
            AI's memory storage
          </p>
        </div>

        <div className="flex-1 min-h-0">
          {/* Streaming Output - Only when processing */}
          {isProcessing && (
            <div className="mb-4 p-3 bg-blue-50/30 rounded-lg border border-blue-200/50">
              <div className="flex items-center space-x-2 mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm font-medium text-blue-700">Processing memory...</span>
              </div>
              <div className="text-xs font-mono text-blue-600 whitespace-pre-wrap max-h-20 overflow-y-auto">
                {streamingText}
              </div>
            </div>
          )}
          
          <ScrollArea className="h-full">
            {/* Memory Steps History */}
            {memorySteps.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Memory Processing</h3>
                <div className="space-y-1">
                  {memorySteps.map((step, index) => {
                    // Check if this step mentions saving a memory
                    const isSavingMemory = step.text.toLowerCase().includes('memory') && 
                      (step.text.toLowerCase().includes('saved') || 
                       step.text.toLowerCase().includes('storing') || 
                       step.text.toLowerCase().includes('adding') ||
                       step.text.toLowerCase().includes('i\'ve added'));
                    
                    // Check if this is a thinking/analyzing step
                    const isThinking = step.text.toLowerCase().includes('analyzing') || 
                      step.text.toLowerCase().includes('processing') ||
                      step.text.toLowerCase().includes('thinking');
                    
                    // Check if this is a memory extraction step
                    const isExtracting = step.text.toLowerCase().includes('extract') || 
                      step.text.toLowerCase().includes('found') ||
                      step.text.toLowerCase().includes('detected') ||
                      step.text.toLowerCase().includes('it states');
                    
                    return (
                      <div 
                        key={index} 
                        className={`rounded-lg p-1.5 text-sm ${
                          isSavingMemory 
                            ? 'bg-green-50 border border-green-200' 
                            : isThinking
                              ? 'bg-blue-50 border border-blue-100'
                              : isExtracting
                                ? 'bg-purple-50 border border-purple-100'
                                : 'bg-gray-50 border border-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {isSavingMemory && (
                            <span className="text-green-500 text-xs">💾 Saving Memory</span>
                          )}
                          {isThinking && (
                            <span className="text-blue-500 text-xs">🧠 Thinking</span>
                          )}
                          {isExtracting && (
                            <span className="text-purple-500 text-xs">🔍 Extracting</span>
                          )}
                          {!isSavingMemory && !isThinking && !isExtracting && (
                            <span className="text-gray-500 text-xs">📝 Processing</span>
                          )}
                          <span className="text-gray-400 text-[10px] ml-auto">
                            {step.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className={`whitespace-pre-wrap ${
                          isSavingMemory ? 'text-green-700' : 
                          isThinking ? 'text-blue-700' : 
                          isExtracting ? 'text-purple-700' : 'text-gray-700'
                        }`}>
                          {step.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Memory List */}
            <div className="space-y-3">
              {memorySteps.length === 0 && memories.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">Waiting for activity...</p>
                  <p className="text-xs text-gray-400">Send messages to see processing</p>
                </div>
              ) : (
                <>
                  {memories.length > 0 && (
                    <div className="mb-2">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Stored Memories</h3>
                      <div className="space-y-3">
                        {memories.map((memory, index) => (
                          <div 
                            key={index} 
                            className={`rounded-lg p-2 shadow-sm border-l-4 ${
                              memory.importance >= 8 ? 'border-l-red-500 bg-red-50/50' :
                              memory.importance >= 6 ? 'border-l-orange-500 bg-orange-50/50' :
                              memory.importance >= 4 ? 'border-l-blue-500 bg-blue-50/50' :
                              'border-l-gray-500 bg-gray-50/50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {memory.importance >= 8 ? '🔴' :
                                   memory.importance >= 6 ? '🟠' :
                                   memory.importance >= 4 ? '🔵' : '⚪'}
                                </span>
                                <h4 className="font-medium text-sm text-gray-900">
                                  {memory.title}
                                </h4>
                              </div>
                              <Badge 
                                variant={memory.importance >= 7 ? "destructive" : memory.importance >= 4 ? "default" : "secondary"}
                                className="text-xs font-bold"
                              >
                                {memory.importance}/10
                              </Badge>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-sm text-gray-700">
                                {memory.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </MemoryColumn>
  );
}
