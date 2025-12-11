'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage } from '@/app/lib/types';
import { ComponentPropsWithoutRef, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
}

type CodeProps = ComponentPropsWithoutRef<'code'> & {
  inline?: boolean;
  node?: object;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div 
      className={`w-full ${isUser ? 'bg-transparent' : 'bg-gray-50/40'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className={`flex gap-4 sm:gap-5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className="flex-shrink-0 pt-1">
            {isUser ? (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <User size={16} className="sm:w-[18px] sm:h-[18px] text-white" strokeWidth={2} />
              </div>
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <Bot size={16} className="sm:w-[18px] sm:h-[18px] text-violet-600" strokeWidth={2} />
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0 pt-1">
            {isUser ? (
              <div className="flex justify-end"> {/* Add this wrapper */}
                <div className="inline-block max-w-[85%] bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-br-md px-4 sm:px-5 py-2.5 sm:py-3 shadow-sm">
                  <div className="whitespace-pre-wrap break-words text-[15px] sm:text-base leading-relaxed tracking-normal">
                    {message.content}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({node, inline, className, children, style, ...props}: CodeProps) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <div className="my-5 rounded-lg overflow-hidden border border-gray-200">
                          <SyntaxHighlighter
                            style={vscDarkPlus as unknown as { [key: string]: CSSProperties }}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              padding: '1rem',
                              fontSize: '0.875rem',
                              lineHeight: '1.7',    
                              borderRadius: '0.5rem',
                            }}
                            {...props} 
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code className="bg-gray-100 text-gray-800 rounded px-1.5 py-0.5 font-mono text-[13px] sm:text-sm font-normal before:content-none after:content-none" {...props}>
                          {children}
                        </code>
                      );
                    },
                    h1: ({...props}) => (
                      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-8 mb-4 leading-tight tracking-tight" {...props} />
                    ),
                    h2: ({...props}) => (
                      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-6 mb-3 leading-snug tracking-tight" {...props} />
                    ),
                    h3: ({...props}) => (
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 mb-2.5 leading-snug" {...props} />
                    ),
                    p: ({...props}) => (
                      <p className="text-[15px] sm:text-base text-gray-800 leading-7 mb-5 tracking-normal" {...props} />
                    ),
                    ul: ({...props}) => (
                      <ul className="list-disc list-outside ml-5 mb-5 space-y-2 text-gray-800" {...props} />
                    ),
                    ol: ({...props}) => (
                      <ol className="list-decimal list-outside ml-5 mb-5 space-y-2 text-gray-800" {...props} />
                    ),
                    li: ({...props}) => (
                      <li className="text-[15px] sm:text-base leading-7 pl-1" {...props} />
                    ),
                    blockquote: ({...props}) => (
                      <blockquote className="border-l-3 border-gray-300 pl-4 py-0.5 italic text-gray-700 my-5 text-[15px] sm:text-base" {...props} />
                    ),
                    a: ({...props}) => (
                      <a className="text-violet-600 hover:text-violet-700 underline underline-offset-2 break-words" {...props} />
                    ),
                    strong: ({...props}) => (
                      <strong className="font-semibold text-gray-900" {...props} />
                    ),
                    em: ({...props}) => (
                      <em className="italic" {...props} />
                    ),
                    hr: ({...props}) => (
                      <hr className="my-6 border-t border-gray-200" {...props} />
                    ),
                    table: ({...props}) => (
                      <div className="overflow-x-auto my-5 border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 text-sm" {...props} />
                      </div>
                    ),
                    thead: ({...props}) => (
                      <thead className="bg-gray-50" {...props} />
                    ),
                    th: ({...props}) => (
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" {...props} />
                    ),
                    td: ({...props}) => (
                      <td className="px-4 py-2 text-[15px] text-gray-800" {...props} />
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
