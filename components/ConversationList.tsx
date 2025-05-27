'use client';

import { useState, useEffect } from 'react';

interface Conversation {
  roomName: string;
  clientEmail: string;
  clientName: string;
  lastMessage: string;
  lastMessageTime: string;
  lastSender: string;
}

interface ConversationListProps {
  onSelectConversation: (roomName: string, clientName: string) => void;
  selectedRoomName?: string;
}

export function ConversationList({ onSelectConversation, selectedRoomName }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations');
        if (response.ok) {
          const { conversations } = await response.json();
          setConversations(conversations);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
    
    // Refresh conversations every 30 seconds
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-sm text-gray-500">Loading conversations...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4">
        <div className="text-sm text-gray-500">No conversations yet</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <button
          key={conversation.roomName}
          onClick={() => onSelectConversation(conversation.roomName, conversation.clientName)}
          className={`w-full text-left p-3 rounded-lg border transition-colors ${
            selectedRoomName === conversation.roomName
              ? 'bg-blue-50 border-blue-200'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-medium text-sm">{conversation.clientName}</h4>
            <span className="text-xs text-gray-500">
              {new Date(conversation.lastMessageTime).toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs text-gray-600 truncate">
            {conversation.lastSender === conversation.clientEmail ? '' : 'You: '}
            {conversation.lastMessage}
          </p>
          <p className="text-xs text-gray-400 mt-1">{conversation.clientEmail}</p>
        </button>
      ))}
    </div>
  );
}