"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Save, 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered
} from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useDrafts } from '@/hooks/use-drafts';

export default function DraftEditorView() {
  const { selectedDraftId } = useAppContext();
  const { drafts, updateDraft, loading } = useDrafts();
  const [draftData, setDraftData] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDraftId && drafts.length > 0) {
      const draft = drafts.find(d => d.id === selectedDraftId);
      if (draft) {
        setDraftData(draft);
        setTitle(draft.draftTitle);
        setContent(draft.content || '');
      }
    }
  }, [selectedDraftId, drafts]);

  const handleSave = async () => {
    if (!selectedDraftId) return;
    
    setIsSaving(true);
    try {
      await updateDraft(selectedDraftId, {
        draftTitle: title,
        content: content,
      });
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'b':
          e.preventDefault();
          handleFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          handleFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          handleFormat('underline');
          break;
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!draftData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No draft selected</h3>
          <p className="text-gray-500">Select a draft from the sidebar to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Draft title..."
            className="font-medium text-lg border-0 bg-transparent focus:ring-0 p-0"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="flex items-center space-x-1 p-2 border-b border-gray-200 bg-gray-50">
        <Button
          onClick={() => handleFormat('bold')}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => handleFormat('italic')}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => handleFormat('underline')}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        <Button
          onClick={() => handleFormat('justifyLeft')}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => handleFormat('justifyCenter')}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => handleFormat('justifyRight')}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        <Button
          onClick={() => handleFormat('insertUnorderedList')}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => handleFormat('insertOrderedList')}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-8">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          className="min-h-full focus:outline-none prose prose-sm max-w-none"
          style={{
            fontFamily: 'Georgia, serif',
            lineHeight: '1.6',
            fontSize: '16px',
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
        <div>
          Last saved: {draftData.updatedAt ? new Date(draftData.updatedAt).toLocaleTimeString() : 'Never'}
        </div>
        <div>
          {content.length} characters
        </div>
      </div>
    </div>
  );
}
