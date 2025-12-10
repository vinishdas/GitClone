'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // [!code ++]
import { MessageBubble } from '@/app/components/MessageBubble';
import { ChatInput } from '@/app/components/ChatInput';
import { Sidebar } from '@/app/components/Sidebar';
import type { ChatMessage } from '@/app/lib/types';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // [!code ++] Hooks for URL management
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Check Login & Load URL Session on Mount
  useEffect(() => {
    fetch('/api/history').then(res => {
      if (res.ok) setIsLoggedIn(true);
    });

    // Check if URL has a session ID (?c=...)
    const urlSessionId = searchParams.get('c');
    if (urlSessionId) {
      handleSelectSession(urlSessionId);
    }
  }, []); // Run once on mount

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

      // Handle Rate Limiting specifically
      if (response.status === 429) {
        setMessages(prev => [...prev, { role: 'assistant', content: "You're typing too fast! Please wait a moment." }]);
        setIsLoading(false);
        return;
      }

      // Capture Session ID if new
      const newSessionHeader = response.headers.get('x-session-id');
      if (newSessionHeader && !currentSessionId) {
        setCurrentSessionId(newSessionHeader);
        // [!code ++] Update URL without reloading
        router.push(`/?c=${newSessionHeader}`, { scroll: false });
      }

      if (!response.body) throw new Error('No response');

      // Setup streaming (Standard streaming logic...)
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
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // [!code ++] Update URL
    router.push(`/?c=${sessionId}`); 
    
    setIsLoading(true);
    setMessages([]); 
    
    try {
      const res = await fetch(`/api/chat/${sessionId}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    router.push('/'); // [!code ++] Clear URL
  };

  return (
    // ... (Existing JSX remains the same)
    <div className="flex h-screen bg-white text-gray-900 font-sans">
       {/* ... Sidebar, Main, etc ... */}
       {isLoggedIn && (
        <Sidebar 
          onSelectSession={handleSelectSession} 
          onNewChat={handleNewChat} 
          currentSessionId={currentSessionId}
        />
      )}
      {/* ... rest of your UI ... */}
       <main className="flex-1 flex flex-col relative">
        {/* Top Right Login Button (if not logged in) */}
        {!isLoggedIn && (
           <div className="absolute top-4 right-4 z-10">
             <a href="/login" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium">
               Log in / Sign up
             </a>
           </div>
        )}

        {/* --- STATE 1: HERO VIEW (No messages yet) --- */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-2xl mx-auto">
            <h1 className="text-4xl font-semibold mb-8 text-gray-800">What can I help with?</h1>
            
            <div className="w-full shadow-lg rounded-2xl border border-gray-200 overflow-hidden">
               <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            </div>
            
            <p className="mt-4 text-gray-500 text-sm">
              Log in to save your chat history.
            </p>
          </div>
        ) : (
        /* --- STATE 2: CHAT VIEW (Messages exist) --- */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="max-w-3xl mx-auto w-full space-y-6">
                {messages.map((msg, index) => (
                  <MessageBubble key={index} message={msg} />
                ))}
              </div>
            </div>

            <div className="p-4 border-t bg-white">
              <div className="max-w-3xl mx-auto">
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}