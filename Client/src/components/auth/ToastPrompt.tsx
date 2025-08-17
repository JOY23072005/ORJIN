import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@context/ThemeContext';

interface ToastPromptProps {
  message: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export const ToastPrompt = ({ message, onSubmit, onCancel }: ToastPromptProps) => {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const themeClasses = {
    container: theme === 'dark' 
      ? 'bg-gray-800 text-gray-100' 
      : 'bg-white text-gray-800',
    input: theme === 'dark'
      ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500',
    cancelButton: theme === 'dark'
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    submitButton: `${
      inputValue.trim()
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
    }`
  };

  return (
    <div className={`p-4 rounded shadow-lg min-w-[300px] ${themeClasses.container}`}>
      <p className="mb-3 font-medium">{message}</p>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && inputValue.trim() && onSubmit(inputValue)}
        className={`w-full p-2 border rounded mb-3 ${themeClasses.input}`}
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className={`px-3 py-1 rounded ${themeClasses.cancelButton}`}
        >
          Cancel
        </button>
        <button
          onClick={() => inputValue.trim() && onSubmit(inputValue)}
          className={`px-3 py-1 rounded ${themeClasses.submitButton}`}
          disabled={!inputValue.trim()}
        >
          OK
        </button>
      </div>
    </div>
  );
};