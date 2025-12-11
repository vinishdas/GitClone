'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MessageBubble } from '@/app/components/MessageBubble';
import { ChatInput } from '@/app/components/ChatInput';
import { Sidebar } from '@/app/components/Sidebar';
import type { ChatMessage } from '@/app/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Menu, User, X } from 'lucide-react';
import { LoadingMessage } from '@/app/components/LoadingMessage';

const SUGGESTION_CARDS = [
  { id: 1, title: 'Write a blog post', prompt: 'Write a blog post about the future of AI in web development' },
  { id: 2, title: 'Explain quantum physics', prompt: 'Explain quantum physics in simple terms' },
  { id: 3, title: 'Create a recipe', prompt: 'Create a healthy breakfast recipe with common ingredients' },
  { id: 4, title: 'Debug my code', prompt: 'Help me debug a React component that won\'t re-render' },
];

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionTitle, setSessionTitle] = useState('New Chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  
  // Check Login & Load URL Session on Mount
  useEffect(() => {
    fetch('/api/history').then(res => {
      if (res.ok) setIsLoggedIn(true);
    });

    const urlSessionId = searchParams.get('c');
    if (urlSessionId) {
      handleSelectSession(urlSessionId);
    }
  }, []);

  const handleSendMessage = async (content: string) => {
    setIsLoading(true);
    const userMessage: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: content, 
          sessionId: currentSessionId 
        }),
      });

      if (response.status === 429) {
        setMessages(prev => [...prev, { role: 'assistant', content: "You're typing too fast! Please wait a moment." }]);
        setIsLoading(false);
        return;
      }

      const newSessionHeader = response.headers.get('x-session-id');
      if (newSessionHeader && !currentSessionId) {
        setCurrentSessionId(newSessionHeader);
        router.push(`/?c=${newSessionHeader}`, { scroll: false });
      }

      if (!response.body) throw new Error('No response');

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;

        setMessages((prev) => {
          const newMsg = [...prev];
          newMsg[newMsg.length - 1].content = assistantText;
          return newMsg;
        });
      }

      // Update session title with first user message
      if (messages.length === 0) {
        setSessionTitle(content.slice(0, 50) + (content.length > 50 ? '...' : ''));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    router.push(`/?c=${sessionId}`); 
    setIsLoading(true);
    setMessages([]); 
    
    try {
      const res = await fetch(`/api/chat/${sessionId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        const firstUserMsg = data.messages.find((m: ChatMessage) => m.role === 'user');
        if (firstUserMsg) {
          setSessionTitle(firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : ''));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setSessionTitle('New Chat');
    router.push('/');
  };

  const handleSuggestionClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans overflow-hidden">
      {/* Sidebar - Desktop & Mobile */}
      {isLoggedIn && (
        <Sidebar 
          onSelectSession={handleSelectSession} 
          onNewChat={handleNewChat} 
          currentSessionId={currentSessionId}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden w-full">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-gray-100">
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {isLoggedIn && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden p-1.5 sm:p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors shrink-0"
                  aria-label="Toggle menu"
                >
                  {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
              <h2 className="text-xs sm:text-sm font-semibold text-gray-700 truncate">
                {sessionTitle}
              </h2>
            </div>

            {!isLoggedIn ? (
              <a 
                href="/login" 
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 active:bg-violet-800 text-xs sm:text-sm font-medium transition-colors shadow-sm shrink-0"
              >
                Log in
              </a>
            ) : (
              <button className="p-1.5 sm:p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors shrink-0">
                <User size={18} className="sm:w-5 sm:h-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Content Area with AnimatePresence */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {messages.length === 0 ? (
              /* HERO STATE */
              <motion.div 
                key="hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center h-full px-3 sm:px-4 pb-16 sm:pb-20 overflow-y-auto"
              >
                {/* Gradient Greeting */}
                <div className="text-center mb-8 sm:mb-12">
                  <motion.h1 
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 bg-linear-to-r from-violet-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent px-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                  >
                    {getGreeting()}
                  </motion.h1>
                  <motion.p 
                    className="text-base sm:text-lg md:text-xl text-gray-500 flex items-center justify-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Sparkles size={16} className="sm:w-5 sm:h-5 text-violet-500" />
                    Ask me anything
                  </motion.p>
                </div>

                {/* Suggestion Cards */}
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-3xl mb-6 sm:mb-8 px-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, staggerChildren: 0.1 }}
                >
                  {SUGGESTION_CARDS.map((card, index) => (
                    <motion.button
                      key={card.id}
                      onClick={() => handleSuggestionClick(card.prompt)}
                      className="group p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-violet-200 hover:shadow-md active:scale-95 transition-all duration-200 text-left"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <p className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-violet-700 transition-colors">
                        {card.title}
                      </p>
                    </motion.button>
                  ))}
                </motion.div>

                {/* Chat Input */}
                <div className="w-full max-w-3xl  ">
                  <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                </div>
              </motion.div>
            ) : (
              /* CHAT STATE */
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto">
                  {messages.map((msg, index) => (
                    <MessageBubble key={index} message={msg} />
                  ))}
                  
                  {/* Show loading animation when AI is responding */}
                  {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                    <LoadingMessage />
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Fixed Input at Bottom */}
                <div className=" border-none  bg-transparent  ">
                  <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
