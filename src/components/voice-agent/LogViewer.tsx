'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Trash2, Copy } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  emoji: string;
}

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Override console.log to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (message: string, level: LogEntry['level'] = 'info') => {
      const emoji = message.match(/^[^\s]+/)?.[0] || '📝';
      const cleanMessage = message.replace(/^[^\s]+\s*/, '');
      
      setLogs(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        level,
        message: cleanMessage,
        emoji,
      }].slice(-50)); // Keep only last 50 logs
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog(args.join(' '), 'info');
    };

    console.error = (...args) => {
      originalError(...args);
      addLog(args.join(' '), 'error');
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog(args.join(' '), 'warning');
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const copyLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.emoji} ${log.message}`
    ).join('\n');
    navigator.clipboard.writeText(logText);
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="h-5 w-5" />
            <CardTitle className="text-lg">Live Logs</CardTitle>
            <Badge variant="secondary">{logs.length}</Badge>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyLogs}
              disabled={logs.length === 0}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
              disabled={logs.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
        <CardDescription>
          Real-time logs from the voice agent and LiveKit connection
        </CardDescription>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <ScrollArea className="h-64 w-full">
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No logs yet. Connect to start seeing activity...
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-2 text-sm"
                  >
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {log.timestamp}
                    </span>
                    <span className="text-lg">{log.emoji}</span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getLevelColor(log.level)}`}
                    >
                      {log.level}
                    </Badge>
                    <span className="flex-1 font-mono text-xs">
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}
