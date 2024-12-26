import React from 'react';

interface SourceInputProps {
  source: string;
  onSourceChange: (source: string) => void;
  handleNext: () => void;
}

const SourceInput: React.FC<SourceInputProps> = ({ source, onSourceChange, handleNext }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Cmd+Enter or Ctrl+Enter to trigger next
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && source.trim()) {
      handleNext();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Source Text
        </label>
        <textarea
          id="source"
          rows={15}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
          placeholder="Paste your source text here..."
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to process
        </p>
      </div>
    </div>
  );
};

export default SourceInput; 