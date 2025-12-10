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
      className={`w-full ${isUser ? 'bg-transparent' : 'bg-gray-50/30'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className={`flex gap-2 sm:gap-3 md:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isUser ? (
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <User size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] text-white" strokeWidth={2.5} />
              </div>
            ) : (
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <Bot size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] text-violet-600" strokeWidth={2} />
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            {isUser ? (
              <div className="inline-block max-w-[90%] sm:max-w-[85%] bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-br-md px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 shadow-md">
                <div className="whitespace-pre-wrap break-words text-sm sm:text-base">{message.content}</div>
              </div>
            ) : (
              <div className="prose prose-slate prose-sm sm:prose-base lg:prose-lg max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({node, inline, className, children, style, ...props}: CodeProps) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <div className="my-3 sm:my-4 rounded-md sm:rounded-lg overflow-hidden shadow-sm">
                          <SyntaxHighlighter
                            style={vscDarkPlus as unknown as { [key: string]: CSSProperties }}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem',
                            }}
                            {...props} 
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code className="bg-gray-100 text-violet-600 rounded px-1 sm:px-1.5 py-0.5 font-mono text-xs sm:text-sm font-semibold before:content-none after:content-none" {...props}>
                          {children}
                        </code>
                      );
                    },
                    h1: ({...props}) => <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-4 sm:mt-6 mb-3 sm:mb-4" {...props} />,
                    h2: ({...props}) => <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-3 sm:mt-5 mb-2 sm:mb-3" {...props} />,
                    h3: ({...props}) => <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mt-3 sm:mt-4 mb-2" {...props} />,
                    p: ({...props}) => <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4" {...props} />,
                    ul: ({...props}) => <ul className="list-disc list-outside ml-4 sm:ml-5 mb-3 sm:mb-4 space-y-1 sm:space-y-2" {...props} />,
                    ol: ({...props}) => <ol className="list-decimal list-outside ml-4 sm:ml-5 mb-3 sm:mb-4 space-y-1 sm:space-y-2" {...props} />,
                    li: ({...props}) => <li className="text-sm sm:text-base text-gray-700 leading-relaxed" {...props} />,
                    blockquote: ({...props}) => (
                      <blockquote className="border-l-2 sm:border-l-4 border-violet-500 pl-3 sm:pl-4 italic text-gray-600 my-3 sm:my-4 text-sm sm:text-base" {...props} />
                    ),
                    a: ({...props}) => (
                      <a className="text-violet-600 hover:text-violet-700 underline font-medium break-words" {...props} />
                    ),
                    table: ({...props}) => (
                      <div className="overflow-x-auto my-3 sm:my-4">
                        <table className="min-w-full text-xs sm:text-sm" {...props} />
                      </div>
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
