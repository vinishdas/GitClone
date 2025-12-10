'use client';

import { useState, FormEvent, KeyboardEvent, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
      setIsFocused(true);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    if (!input.trim()) {
      setIsFocused(false);
    }
  };

  const isDisabled = isLoading || !input.trim();
  const showFooter = !isFocused && !input.trim();

  return (
    <div className="w-full max-w-3xl mx-auto px-3  sm:px-4 mb-2 mt-2.5 ">
      <motion.div
        initial={false}
        animate={{ 
          paddingBottom: showFooter ? '0px' : '0px'
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="pb-4 sm:pb-6"
      >
        <form onSubmit={handleSubmit} className="relative">
          {/* Floating Input Container with Enhanced Shadow */}
          <motion.div 
            className="relative rounded-2xl sm:rounded-3xl border border-gray-200/80 bg-white overflow-hidden"
            style={{
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02), 0 8px 24px rgba(0, 0, 0, 0.08), 0 16px 48px rgba(0, 0, 0, 0.06)'
            }}
            whileFocus={{ 
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.03), 0 12px 32px rgba(0, 0, 0, 0.1), 0 20px 56px rgba(0, 0, 0, 0.08)'
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Message AI..."
              disabled={isLoading}
              rows={1}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 pr-12 sm:pr-14 resize-none bg-transparent text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                minHeight: '52px',
                maxHeight: '200px',
              }}
            />
            
            {/* Send Button - Circular */}
            <motion.button
              type="submit"
              disabled={isDisabled}
              className={`absolute right-2 sm:right-3 bottom-2.5 sm:bottom-3.5 rounded-full p-2 sm:p-2.5 transition-colors ${
                isDisabled
                  ? 'bg-gray-200 cursor-not-allowed'
                  : 'bg-gray-900 hover:bg-gray-800 active:bg-gray-950'
              }`}
              whileHover={!isDisabled ? { scale: 1.05 } : {}}
              whileTap={!isDisabled ? { scale: 0.95 } : {}}
            >
              <ArrowUp 
                size={18}
                className={`sm:w-5 sm:h-5 ${isDisabled ? 'text-gray-400' : 'text-white'}`}
                strokeWidth={2.5}
              />
            </motion.button>
          </motion.div>
        </form>
        
        {/* Footer Disclaimer with AnimatePresence */}
         
      </motion.div>
    </div>
  );
}
