"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TavusInterface() {
  const [tavusUrl, setTavusUrl] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoadTavus = () => {
    if (tavusUrl) {
      setIsLoaded(true);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTavusUrl(e.target.value);
    setIsLoaded(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header with URL input */}
      <div className="bg-white border-b p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-7xl mx-auto">
          <div className="flex-1 w-full">
            <Label htmlFor="tavus-url" className="text-sm font-medium">
              Tavus Conversation URL
            </Label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <Input
                id="tavus-url"
                placeholder="https://your-tavus-conversation-url.com"
                value={tavusUrl}
                onChange={handleUrlChange}
                className="flex-1"
              />
              <Button onClick={handleLoadTavus} disabled={!tavusUrl} className="sm:w-auto">
                Load
              </Button>
            </div>
          </div>
          <Badge variant="outline" className="sm:ml-4 self-start sm:self-auto">
            Tavus Interface
          </Badge>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left side - Tavus iframe */}
        <div className="flex-1 flex flex-col">
          {isLoaded && tavusUrl ? (
            <iframe
              src={tavusUrl}
              className="flex-1 w-full border-0"
              title="Tavus Conversation"
              allow="camera; microphone; fullscreen"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-100">
              <Card className="w-full max-w-sm mx-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🎥</span>
                    Tavus Conversation
                  </CardTitle>
                  <CardDescription>
                    Enter a Tavus conversation URL above to start
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    This area will display your Tavus conversation once a valid URL is provided.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right side - Tools panel */}
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-xl">🛠️</span>
              Development Tools
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Memory, notes, and development utilities
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Memory Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    💭 Conversation Memory
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="memory-input" className="text-xs">
                      Add to memory
                    </Label>
                    <Input
                      id="memory-input"
                      placeholder="Remember this..."
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Recent memories</Label>
                    <div className="space-y-1">
                      <div className="text-xs p-2 bg-gray-50 rounded border">
                        User prefers detailed explanations
                      </div>
                      <div className="text-xs p-2 bg-gray-50 rounded border">
                        Working on hackathon project
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    📝 Quick Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="notes-input" className="text-xs">
                      Add note
                    </Label>
                    <Input
                      id="notes-input"
                      placeholder="Quick note..."
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs p-2 bg-blue-50 rounded border border-blue-200">
                      <strong>12:34 PM:</strong> Need to implement split-screen
                    </div>
                    <div className="text-xs p-2 bg-green-50 rounded border border-green-200">
                      <strong>12:30 PM:</strong> Tavus integration working
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Development Tools */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    🔧 Dev Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      Console
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      Network
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Status</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Connected</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    ⚡ Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Save Session
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Export Logs
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Clear Memory
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
