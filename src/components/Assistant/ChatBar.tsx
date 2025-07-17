import React from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatBarProps {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  chatHistory: ChatMessage[];
  loading: boolean;
  error: string | null;
  chatEndRef: React.RefObject<HTMLDivElement>;
  prompts?: string[];
  onPromptClick?: (prompt: string) => void;
  onUploadClick?: () => void;
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadedDocName?: string | null;
  fileInputRef?: React.RefObject<HTMLInputElement>;
}

const ChatBar = ({ input, setInput, onSend, chatHistory, loading, error, chatEndRef, prompts = [], onPromptClick, onUploadClick, onFileChange, uploadedDocName, fileInputRef }: ChatBarProps) => {
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-3 w-full min-h-[500px] border border-gray-100">
      <div className="h-[350px] md:h-[450px] overflow-y-auto border-b mb-2 px-1 flex flex-col gap-2">
        {chatHistory.length === 0 && (
          <div className="text-gray-400 text-center mt-12">Start a conversation or select a suggestion below.</div>
        )}
        {chatHistory.map((msg: ChatMessage) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-end gap-2 max-w-[80%]`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">L</div>
              )}
              <div
                className={`px-4 py-2 rounded-2xl shadow-sm whitespace-pre-line text-base ${
                msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md border'
              }`}
            >
              {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">U</div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start mb-2">
            <div className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-500 animate-pulse shadow-sm">LexAI is typing...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      {prompts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-100 text-sm transition"
              onClick={() => onPromptClick && onPromptClick(prompt)}
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
      {error && <div className="text-red-500 text-xs text-center">{error}</div>}
      <div className="flex gap-2 mt-2 items-center w-full">
        <button
          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-full border border-blue-200 transition flex items-center"
          onClick={onUploadClick}
          type="button"
        >
          <span className="mr-2">📎</span> Upload
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={onFileChange}
          accept=".txt,.md,.json,.pdf,.docx,.doc"
        />
        {uploadedDocName && (
          <span className="text-xs text-gray-600 truncate max-w-[120px]">{uploadedDocName}</span>
        )}
        <input
          type="text"
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 text-base shadow-sm"
          placeholder="Ask LexAI or describe your document..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={loading}
        />
        <button
          className="bg-blue-600 text-white px-5 py-2 rounded-full shadow-sm disabled:opacity-60 text-base font-semibold"
          onClick={onSend}
          disabled={loading || !input.trim()}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatBar; 