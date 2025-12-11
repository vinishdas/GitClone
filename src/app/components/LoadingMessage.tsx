'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export function LoadingMessage() {
  return (
    <motion.div 
      className="w-full bg-gray-50/40"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex gap-4 sm:gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0 pt-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-violet-100 flex items-center justify-center">
              <Bot size={16} className="sm:w-[18px] sm:h-[18px] text-violet-600" strokeWidth={2} />
            </div>
          </div>

          {/* Loading Content */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[15px] sm:text-base text-gray-600">
                Thinking
              </span>
              
              {/* Animated Dots */}
              <div className="flex gap-1">
                <motion.div
                  className="w-1.5 h-1.5 bg-violet-600 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="w-1.5 h-1.5 bg-violet-600 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                />
                <motion.div
                  className="w-1.5 h-1.5 bg-violet-600 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                />
              </div>
            </div>

            {/* Pulsing Bar */}
            <div className="mt-3 w-full max-w-md h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
