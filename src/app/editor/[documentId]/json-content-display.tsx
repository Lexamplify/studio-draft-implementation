"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, ChevronDown, ChevronRight, FileText } from "lucide-react";

interface JsonContentDisplayProps {
  content: any;
  title?: string;
  onCopy?: (content: string) => void;
}

export const JsonContentDisplay = ({ content, title = "Content", onCopy }: JsonContentDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatJson = (obj: any, indent: number = 0): string => {
    if (obj === null) return "null";
    if (obj === undefined) return "undefined";
    if (typeof obj === "string") return `"${obj}"`;
    if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return "[]";
      const items = obj.map(item => 
        "  ".repeat(indent + 1) + formatJson(item, indent + 1)
      ).join(",\n");
      return `[\n${items}\n${"  ".repeat(indent)}]`;
    }
    
    if (typeof obj === "object") {
      const keys = Object.keys(obj);
      if (keys.length === 0) return "{}";
      const items = keys.map(key => 
        "  ".repeat(indent + 1) + `"${key}": ${formatJson(obj[key], indent + 1)}`
      ).join(",\n");
      return `{\n${items}\n${"  ".repeat(indent)}}`;
    }
    
    return String(obj);
  };

  // Check if this is a TipTap JSON document
  const isTipTapDocument = content && 
    typeof content === 'object' && 
    content.type === 'doc' && 
    Array.isArray(content.content);

  const handleCopy = () => {
    const jsonString = JSON.stringify(content, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      onCopy?.(jsonString);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const jsonString = formatJson(content);
  const isLongContent = jsonString.length > 200;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <FileText className="w-4 h-4" />
        <span className="font-medium">{title}</span>
        <span className="text-xs text-gray-400">
          {typeof content} • {Array.isArray(content) ? `${content.length} items` : 'object'}
        </span>
      </div>
      
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Header with expand/collapse and copy buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs h-6 px-2"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 mr-1" />
                ) : (
                  <ChevronRight className="w-3 h-3 mr-1" />
                )}
                {isExpanded ? "Collapse" : "Expand"}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-xs h-6 px-2"
              >
                <Copy className="w-3 h-3 mr-1" />
                {copied ? "Copied!" : "Copy JSON"}
              </Button>
            </div>

            {/* JSON Content */}
            <div className="bg-white rounded border p-2 max-h-96 overflow-auto">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                {isExpanded || !isLongContent ? jsonString : `${jsonString.substring(0, 200)}...`}
              </pre>
            </div>

            {/* Content Summary */}
            <div className="text-xs text-gray-500">
              {isLongContent && !isExpanded && (
                <span>Click "Expand" to see full content • </span>
              )}
              {isTipTapDocument && (
                <span className="text-blue-600 font-medium">TipTap Document • </span>
              )}
              <span>{jsonString.length} characters</span>
              {isTipTapDocument && content.content && (
                <span> • {content.content.length} content blocks</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
