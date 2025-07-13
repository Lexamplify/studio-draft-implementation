import React from 'react';

const prompts = [
  'Summarize Document',
  'Translate Document',
  'Generate Arguments & Counter-Arguments',
  'Generate Citations',
];

const PromptButtons = ({ onPromptClick }: { onPromptClick: (prompt: string) => void }) => {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          className="bg-gray-100 hover:bg-blue-100 text-gray-700 px-3 py-1 rounded border"
          onClick={() => onPromptClick(prompt)}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};

export default PromptButtons; 