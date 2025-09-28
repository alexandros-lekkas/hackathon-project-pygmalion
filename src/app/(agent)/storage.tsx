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
    memorySteps,
  } = useChatContext();

  return (
    <MemoryColumn isProcessing={isProcessing}>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 mb-4">
          <h2 className="text-lg font-semibold">Storage</h2>
          <p className="text-sm text-muted-foreground">AI's memory storage</p>
        </div>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            {/* Unified Log View */}
            <div className="space-y-1">
              {/* Live Thinking Card */}
              {(isProcessing || streamingText) && (
                <div className="mb-4 bg-blue-50/30 rounded-lg border border-blue-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isProcessing && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      )}
                      <span className="font-semibold text-blue-700">
                        {isProcessing ? "Processing Memory..." : "Last Processed"}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm font-mono text-blue-700 whitespace-pre-wrap bg-white/50 p-3 rounded border border-blue-100 min-h-[60px]">
                    {streamingText || "Analyzing message..."}
                  </div>
                </div>
              )}

              {/* Memory Steps History */}
              {memorySteps.map((step, index) => {
                // Use the step type if available, otherwise detect from content
                const isSavingMemory = step.type === 'memory' || (
                  step.text.toLowerCase().includes("memory") &&
                  (step.text.toLowerCase().includes("saved") ||
                    step.text.toLowerCase().includes("storing") ||
                    step.text.toLowerCase().includes("adding") ||
                    step.text.toLowerCase().includes("i've added") ||
                    step.text.toLowerCase().includes("updated"))
                );

                // Check if this is a thinking/analyzing step
                const isThinking = step.type === 'thinking' || (
                  step.text.toLowerCase().includes("analyzing") ||
                  step.text.toLowerCase().includes("processing") ||
                  step.text.toLowerCase().includes("thinking") ||
                  step.text.toLowerCase().includes("looking") ||
                  step.text.toLowerCase().includes("checking")
                );

                // Check if this is a memory extraction step
                const isExtracting = step.type === 'extract' || (
                  step.text.toLowerCase().includes("extract") ||
                  step.text.toLowerCase().includes("found") ||
                  step.text.toLowerCase().includes("detected") ||
                  step.text.toLowerCase().includes("it states")
                );

                return (
                  <div
                    key={index}
                    className="border-l-2 pl-2 py-1 text-sm"
                    style={{
                      borderColor: isSavingMemory
                        ? "#10b981" // green
                        : isThinking
                        ? "#3b82f6" // blue
                        : isExtracting
                        ? "#8b5cf6" // purple
                        : "#9ca3af", // gray
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span
                        className="text-xs font-mono"
                        style={{
                          color: isSavingMemory
                            ? "#10b981" // green
                            : isThinking
                            ? "#3b82f6" // blue
                            : isExtracting
                            ? "#8b5cf6" // purple
                            : "#6b7280", // gray
                        }}
                      >
                        {isSavingMemory
                          ? "[MEMORY]"
                          : isThinking
                          ? "[THINKING]"
                          : isExtracting
                          ? "[EXTRACT]"
                          : "[LOG]"}
                      </span>
                      <span className="text-gray-400 text-[10px] ml-auto">
                        {step.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-gray-700 font-mono text-xs">
                      {step.text}
                    </div>
                  </div>
                );
              })}

              {/* Memory List */}
              <div className="space-y-3 mt-4">
                {memorySteps.length === 0 && memories.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">Waiting for activity...</p>
                    <p className="text-xs text-gray-400">
                      Send messages to see processing
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Stored Memories */}
                    {memories.map((memory, index) => {
                      const borderColor =
                        memory.importance >= 8
                          ? "#ef4444" // red
                          : memory.importance >= 6
                          ? "#f97316" // orange
                          : memory.importance >= 4
                          ? "#3b82f6" // blue
                          : "#9ca3af"; // gray

                      return (
                        <div
                          key={index}
                          className="border-l-2 pl-2 py-1 mt-2"
                          style={{ borderColor }}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className="text-xs font-mono font-bold"
                              style={{ color: borderColor }}
                            >
                              [STORED] {memory.title}
                            </span>
                            <Badge
                              variant={
                                memory.importance >= 7
                                  ? "destructive"
                                  : memory.importance >= 4
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {memory.importance}/10
                            </Badge>
                          </div>
                          <div className="text-xs font-mono text-gray-700 mt-1">
                            {memory.content}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </MemoryColumn>
  );
}
