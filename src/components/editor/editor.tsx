"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";

import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";

import Image from "@tiptap/extension-image";

import Underline from "@tiptap/extension-underline";
import FontFamily from "@tiptap/extension-font-family";
import TextStyle from "@tiptap/extension-text-style";

import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";

import TextAlign from "@tiptap/extension-text-align";

import Link from "@tiptap/extension-link";

import { useEditorStore } from "@/store/use-editor-store";
import { FontSizeExtensions } from "@/extensions/font-size";
import { LineHeightExtension } from "@/extensions/line-height";
import { Ruler } from "./ruler";
import { FloatingLegalAIButton } from "./floating-legal-ai-button";
import { FloatingExpandButton } from "./floating-expand-button";
import { LEFT_MARGIN_DEFAULT, RIGHT_MARGIN_DEFAULT } from "@/constants/margins";
import { useState, useEffect, useRef } from "react";
import { updateDocument } from "@/lib/firebase-document-service";
import { Document as DocumentType } from "@/lib/firebase-document-service";

interface EditorProps {
  initialContent?: string | object | undefined;
  onLegalAI?: () => void;
  document?: DocumentType;
}

export const Editor = ({ initialContent, onLegalAI, document: doc }: EditorProps) => {
  const leftMargin = LEFT_MARGIN_DEFAULT;
  const rightMargin = RIGHT_MARGIN_DEFAULT;
  
  // State for floating AI button
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [floatingButtonPosition, setFloatingButtonPosition] = useState({ x: 0, y: 0 });

  // Console logging for editor content
  const isTipTapJSON = typeof initialContent === 'object' && 
    initialContent !== null && 
    'type' in initialContent && 
    (initialContent as { type: string }).type === 'doc';
    
  console.log("✏️ Editor received initialContent:", {
    content: initialContent,
    type: typeof initialContent,
    isTipTapJSON,
    contentLength: typeof initialContent === 'string' ? initialContent.length : 'N/A'
  });

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setFloatingButtonPosition({
            x: rect.left + rect.width / 2,
            y: rect.top
          });
          setShowFloatingButton(true);
        } catch (error) {
          // Selection might be invalid, hide button
          setShowFloatingButton(false);
        }
      } else {
        setShowFloatingButton(false);
      }
    };

    globalThis.document.addEventListener('selectionchange', handleSelection);
    return () => globalThis.document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const { setEditor } = useEditorStore();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    editable: true,
    onCreate({ editor }) {
      setEditor(editor);
      // Ensure editor is editable
      editor.setEditable(true);
      // Set content immediately after creation if it's available
      if (initialContent) {
        editor.commands.setContent(initialContent);
        console.log("🎯 Editor created and content set:", {
          isEditable: editor.isEditable,
          type: typeof initialContent,
          htmlPreview: typeof initialContent === 'string' ? initialContent.substring(0, 50) + '...' : 'object'
        });
      } else {
        console.log("🎯 Editor created without initial content");
      }
    },
    onDestroy() {
      setEditor(null);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    },
    onUpdate({ editor }) {
      setEditor(editor);
      
      // Auto-save functionality
      if (doc) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(async () => {
          try {
            const content = JSON.stringify(editor.getJSON());
            await updateDocument(doc.id, {
              initialContent: content,
            });
            console.log("✅ Document auto-saved");
            autoSaveTimeoutRef.current = null;
          } catch (error) {
            console.error("❌ Failed to auto-save:", error);
            autoSaveTimeoutRef.current = null;
          }
        }, 2000);
      }
    },
    onSelectionUpdate({ editor }) {
      setEditor(editor);
    },
    onTransaction({ editor }) {
      setEditor(editor);
    },
    onFocus({ editor }) {
      setEditor(editor);
    },
    onBlur({ editor }) {
      setEditor(editor);
    },
    onContentError({ editor }) {
      setEditor(editor);
    },
    editorProps: {
      attributes: {
        style: `padding-left: ${leftMargin}px; padding-right: ${rightMargin}px;`,
        class:
          "focus:outline-none print:boder-0 border bg-white border-editor-border flex flex-col min-h-[1054px] w-[816px] pt-10 pr-14 pb-10 cursor-text",
      },
    },
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Table,
      TableCell,
      TableHeader,
      TableRow,
      TaskList,
      Image,
      Underline,
      FontFamily,
      TextStyle,
      Color,
      LineHeightExtension.configure({
        types: ["heading", "paragraph"],
        defaultLineHeight: "1.5",
      }),
      FontSizeExtensions,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TaskItem.configure({ nested: true }),
    ] as any,
  });

  // Update editor content when initialContent changes (for dynamic updates after mount)
  useEffect(() => {
    if (!editor) return;

    // Only update if content is provided and different from current
    if (initialContent) {
      const currentHTML = editor.getHTML();
      let shouldUpdate = false;

      if (typeof initialContent === 'string') {
        // For HTML strings, compare HTML
        const normalizedCurrent = currentHTML.trim();
        const normalizedNew = initialContent.trim();
        shouldUpdate = normalizedCurrent !== normalizedNew && normalizedNew !== '<p></p>';
      } else if (typeof initialContent === 'object') {
        // For TipTap JSON, compare JSON
        const currentJSON = JSON.stringify(editor.getJSON());
        const newJSON = JSON.stringify(initialContent);
        shouldUpdate = currentJSON !== newJSON;
      }

      if (shouldUpdate) {
        console.log("📝 Updating editor content from useEffect");
        editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialContent]);

  return (
    <div className="size-full overflow-x-auto bg-[#FAFBFD] px-4 print:p-0 print:bg-white print:overflow-visible">
      <Ruler leftMargin={leftMargin} rightMargin={rightMargin} />
      <div className="min-w-max flex justify-center w-[816px] py-4 print:py-0 mx-auto print:w-full print:min-w-0">
        <EditorContent editor={editor} />
      </div>
      
      {/* Floating Legal AI Button */}
      {onLegalAI && (
        <FloatingLegalAIButton
          onLegalAI={onLegalAI}
          isVisible={showFloatingButton}
          position={floatingButtonPosition}
        />
      )}

      {/* Floating Expand Button */}
      <FloatingExpandButton
        isVisible={showFloatingButton}
        position={floatingButtonPosition}
      />
    </div>
  );
};
