import { useEffect, useState } from 'react';

interface HistoryItem {
  id: string;
  title: string;
  createdAt: string;
}

interface SidebarProps {
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  currentSessionId: string | null;
}

export function Sidebar({ onSelectSession, onNewChat, currentSessionId }: SidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // FIX: Define the function INSIDE the effect to avoid dependency warnings
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
  }, [currentSessionId]); // Re-run only when session ID changes

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); 
    if (!confirm('Delete this chat?')) return;

    try {
      await fetch(`/api/chat/${sessionId}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(item => item.id !== sessionId));
      if (currentSessionId === sessionId) {
        onNewChat();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-64 border-r h-full flex flex-col p-4 bg-gray-50">
      <button 
        onClick={onNewChat}
        className="mb-4 w-full py-2 px-4 bg-black text-white rounded hover:bg-gray-800"
      >
        + New Chat
      </button>
      
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">History</h3>
        <ul>
          {history.map((item) => (
            <li key={item.id} className="mb-1 group relative">
              <button
                onClick={() => onSelectSession(item.id)}
                className={`w-full text-left p-2 pr-8 rounded text-sm truncate ${
                  currentSessionId === item.id 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                {item.title}
              </button>
              
              {/* Delete Icon */}
              <button
                onClick={(e) => handleDelete(e, item.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
                title="Delete Chat"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}