import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage } from '@/app/lib/types';
import { ComponentPropsWithoutRef, CSSProperties } from 'react';

interface MessageBubbleProps {
  message: ChatMessage;
}

// Define specific props for the code renderer
type CodeProps = ComponentPropsWithoutRef<'code'> & {
  inline?: boolean;
  node?: object;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
      <strong className="text-sm text-gray-500">{isUser ? 'User' : 'AI'}</strong>
      
      <div className={`rounded-lg p-4 max-w-[85%] overflow-x-auto ${
        isUser ? 'bg-blue-100 text-gray-900' : 'bg-gray-50 text-gray-900 border border-gray-200'
      }`}>
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              code({node, inline, className, children, style, ...props}: CodeProps) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    // [FIX] Use double-casting (unknown -> correct type) to fix strict type mismatch
                    style={vscDarkPlus as unknown as { [key: string]: CSSProperties }}
                    language={match[1]}
                    PreTag="div"
                    {...props} 
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-gray-200 rounded px-1 py-0.5 font-mono text-sm text-red-500" {...props}>
                    {children}
                  </code>
                );
              },
              h1: ({...props}) => <h1 className="text-2xl font-bold my-2" {...props} />,
              h2: ({...props}) => <h2 className="text-xl font-bold my-2" {...props} />,
              p: ({...props}) => <p className="my-2 leading-relaxed" {...props} />,
              ul: ({...props}) => <ul className="list-disc list-inside my-2" {...props} />,
              ol: ({...props}) => <ol className="list-decimal list-inside my-2" {...props} />,
              li: ({...props}) => <li className="my-1" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}