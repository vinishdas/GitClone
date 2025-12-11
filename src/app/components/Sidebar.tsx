// src/app/components/Sidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, LogOut } from 'lucide-react'; // Import LogOut icon
import { useRouter } from 'next/navigation'; // Import useRouter for redirection

interface HistoryItem {
  id: string;
  title: string;
  createdAt: string;
}

interface SidebarProps {
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  currentSessionId: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ onSelectSession, onNewChat, currentSessionId, isOpen = true, onClose }: SidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const router = useRouter(); // Initialize router

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history');
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (error) {
        console.error('Failed to load history');
      }
    };

    fetchHistory();
  }, [currentSessionId]);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); 
    if (!confirm('Delete this chat?')) return;

    try {
      const res = await fetch(`/api/chat/${sessionId}`, { method: 'DELETE' });
      
      if (!res.ok) {
        throw new Error('Failed to delete chat');
      }

      setHistory(prev => prev.filter(item => item.id !== sessionId));
      if (currentSessionId === sessionId) {
        onNewChat();
      }
    } catch (err) {
      console.error(err);
      alert('Could not delete chat. Please try again.');
    }
  };

  // Handle Logout Function
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login'); 
      router.refresh(); 
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    onSelectSession(sessionId);
    onClose?.();
  };

  const handleNewChatClick = () => {
    onNewChat();
    onClose?.();
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && onClose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:block fixed md:relative left-0 top-0 z-50 md:z-auto h-screen`}>
        <div className="w-64 sm:w-72 h-full border-r border-gray-200 bg-gray-50/90 backdrop-blur-sm flex flex-col shadow-xl md:shadow-none">
          {/* Header with Close Button (Mobile Only) */}
          <div className="flex items-center justify-between p-4 md:hidden flex-shrink-0 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">Chat History</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-3 sm:p-4 flex-shrink-0">
            <motion.button 
              onClick={handleNewChatClick}
              className="w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-violet-600 text-white rounded-lg text-sm sm:text-base font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition-shadow"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
              New Chat
            </motion.button>
          </div>
          
          {/* History List */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2 sticky top-0 bg-gray-50/90 py-2 z-10">
              History
            </h3>
            
            {history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs sm:text-sm text-gray-400">No chat history yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    className="group relative"
                  >
                    <button
                      onClick={() => handleSessionSelect(item.id)}
                      className={`w-full text-left py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 relative overflow-hidden ${
                        currentSessionId === item.id 
                          ? 'bg-violet-50 text-violet-700' 
                          : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                      }`}
                    >
                      {currentSessionId === item.id && (
                        <motion.div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 sm:h-8 bg-violet-600 rounded-r-full"
                          layoutId="activeIndicator"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      
                      <span className={`block truncate ${currentSessionId === item.id ? 'pl-2 sm:pl-3' : ''}`}>
                        {item.title}
                      </span>
                    </button>
                    
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 sm:p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-10"
                      title="Delete Chat"
                    >
                      <Trash2 size={14} className="sm:w-4 sm:h-4" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="p-3 sm:p-4 border-t border-gray-200 mt-auto bg-gray-50/50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-start gap-3 py-2.5 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium text-gray-600 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} className="sm:w-5 sm:h-5" strokeWidth={2} />
              <span>Log out</span>
            </button>
          </div>

        </div>
      </div>
    </>
  );
}