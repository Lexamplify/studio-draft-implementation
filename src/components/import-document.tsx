"use client";

import { useState, useRef } from "react";
import { UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import mammoth from "mammoth";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebaseClient";
import { createDocument } from "@/lib/firebase-document-service";

export const ImportDocument = () => {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user] = useAuthState(auth);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const content = await parseFileContent(file);
      const title = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension

      if (!user?.uid) {
        toast.error("Please sign in to import documents");
        return;
      }
      const documentId = await createDocument(user.uid, title, content);

      toast.success("Document imported successfully");
      router.push(`/documents/${documentId}`);
    } catch (error) {
      console.error("Error importing document:", error);
      toast.error("Failed to import document");
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const parseFileContent = async (file: File): Promise<string> => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType === "text/plain" || fileName.endsWith(".txt")) {
      const text = await file.text();
      return convertTextToTipTap(text);
    } else if (fileType === "text/html" || fileName.endsWith(".html")) {
      const htmlContent = await file.text();
      // Convert HTML to TipTap format to preserve formatting
      return convertHtmlToTipTap(htmlContent);
    } else if (fileName.endsWith(".md")) {
      const markdown = await file.text();
      return convertMarkdownToTipTap(markdown);
    } else if (fileName.endsWith(".json")) {
      try {
        const jsonContent = await file.text();
        const parsed = JSON.parse(jsonContent);
        
        // Enhanced validation for TipTap JSON document
        if (parsed.type === "doc" && Array.isArray(parsed.content)) {
          // Validate that it has proper TipTap structure
          const isValidTipTapDoc = parsed.content.every((item: any) => 
            item && typeof item === 'object' && typeof item.type === 'string'
          );
          
          if (isValidTipTapDoc) {
            console.log("✅ Valid TipTap JSON document detected, preserving all formatting");
            // Return the TipTap document as-is to preserve all formatting
            return JSON.stringify(parsed);
          }
        }
        
        // If it's not a valid TipTap document, convert to TipTap format
        console.log("Converting JSON to TipTap format");
        return convertTextToTipTap(JSON.stringify(parsed, null, 2));
      } catch (error) {
        console.error("Error parsing JSON:", error);
        // If JSON parsing fails, treat as plain text
        const text = await file.text();
        return convertTextToTipTap(text);
      }
    } else if (fileName.endsWith(".docx")) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        // Convert HTML to TipTap format to preserve formatting
        return convertHtmlToTipTap(result.value);
      } catch (error) {
        console.error("Error parsing .docx file:", error);
        throw new Error("Failed to parse .docx file");
      }
    } else if (fileName.endsWith(".pdf")) {
      // PDF parsing is temporarily disabled due to webpack compatibility issues
      // Users can convert PDF to text using online tools or copy-paste the content
      throw new Error("PDF import is currently unavailable. Please copy the text from your PDF and paste it into a new document, or convert your PDF to a .txt file first.");
    } else {
      // For unsupported file types, try to read as text
      try {
        const text = await file.text();
        return convertTextToTipTap(text);
      } catch {
        throw new Error("Unsupported file type");
      }
    }
  };

  const convertTextToTipTap = (text: string): string => {
    // Convert plain text to TipTap format
    const lines = text.split('\n');
    const content = lines.map(line => {
      if (line.trim() === '') {
        return { type: 'paragraph', content: [] };
      }
      return {
        type: 'paragraph',
        content: [{ type: 'text', text: line }]
      };
    });
    
    return JSON.stringify({
      type: 'doc',
      content: content
    });
  };

  const convertHtmlToTipTap = (html: string): string => {
    // Convert HTML to TipTap format
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    const convertNode = (node: Node): { type: string; content?: unknown[]; attrs?: Record<string, unknown>; text?: string; marks?: Array<{ type: string }> } | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        return text ? { type: 'text', text } : null;
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        const children = Array.from(node.childNodes)
          .map(convertNode)
          .filter(Boolean);
        
        switch (tagName) {
          case 'h1':
            return { type: 'heading', attrs: { level: 1 }, content: children };
          case 'h2':
            return { type: 'heading', attrs: { level: 2 }, content: children };
          case 'h3':
            return { type: 'heading', attrs: { level: 3 }, content: children };
          case 'h4':
            return { type: 'heading', attrs: { level: 4 }, content: children };
          case 'h5':
            return { type: 'heading', attrs: { level: 5 }, content: children };
          case 'h6':
            return { type: 'heading', attrs: { level: 6 }, content: children };
          case 'p':
            return { type: 'paragraph', content: children };
          case 'strong':
          case 'b':
            return { type: 'text', marks: [{ type: 'bold' }], text: element.textContent || '' };
          case 'em':
          case 'i':
            return { type: 'text', marks: [{ type: 'italic' }], text: element.textContent || '' };
          case 'u':
            return { type: 'text', marks: [{ type: 'underline' }], text: element.textContent || '' };
          case 'ul':
            return { type: 'bulletList', content: children };
          case 'ol':
            return { type: 'orderedList', content: children };
          case 'li':
            return { type: 'listItem', content: children };
          case 'br':
            return { type: 'hardBreak' };
          default:
            return children.length > 0 ? { type: 'paragraph', content: children } : null;
        }
      }
      
      return null;
    };
    
    const content = Array.from(tempDiv.childNodes)
      .map(convertNode)
      .filter(Boolean);
    
    return JSON.stringify({
      type: 'doc',
      content: content
    });
  };

  const convertMarkdownToTipTap = (markdown: string): string => {
    // Simple markdown to TipTap conversion
    const lines = markdown.split('\n');
    const content: Array<{ type: string; content?: unknown[]; attrs?: Record<string, unknown>; text?: string; marks?: Array<{ type: string }> }> = [];
    
    for (const line of lines) {
      if (line.trim() === '') {
        content.push({ type: 'paragraph', content: [] });
        continue;
      }
      
      // Headers
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, '');
        content.push({
          type: 'heading',
          attrs: { level: Math.min(level, 6) },
          content: [{ type: 'text', text }]
        });
        continue;
      }
      
      // Bold and italic text
      let textContent = line;
      const marks: Array<{ type: string }> = [];
      
      if (textContent.includes('**') || textContent.includes('__')) {
        marks.push({ type: 'bold' });
      }
      if (textContent.includes('*') || textContent.includes('_')) {
        marks.push({ type: 'italic' });
      }
      
      // Clean up markdown syntax
      textContent = textContent.replace(/\*\*|__/g, '').replace(/\*|_/g, '');
      
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: textContent, marks: marks.length > 0 ? marks : undefined }]
      });
    }
    
    return JSON.stringify({
      type: 'doc',
      content: content
    });
  };

  return (
    <div className="flex flex-col gap-y-2.5">
      <div
        className={cn(
          "aspect-[3/4] flex flex-col gap-y-4 items-center justify-center rounded-sm border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer bg-white",
          isImporting && "pointer-events-none opacity-50"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon className="size-8 text-gray-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">Import Document</p>
          <p className="text-xs text-gray-500 mt-1">
            TXT, HTML, MD, DOCX
          </p>
          <p className="text-xs text-green-600 mt-1">
            ✅ TipTap JSON fully supported
          </p>
          <p className="text-xs text-orange-500 mt-1">
            PDF temporarily unavailable
          </p>
        </div>
      </div>
      <p className="text-sm font-medium truncate">Import Document</p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.html,.md,.json,.docx"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

// Helper function for className concatenation
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(" ");
};

