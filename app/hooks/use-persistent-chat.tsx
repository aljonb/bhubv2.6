'use client'

import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

export interface ChatMessage {
  id: string
  content: string
  sender_email: string
  sender_name: string
  room_name: string
  created_at: string
}

interface UsePersistentChatProps {
  roomName: string
}

export function usePersistentChat({ roomName }: UsePersistentChatProps) {
  const { user } = useUser()
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!roomName) return;
      
      try {
        const response = await fetch(`/api/messages?roomName=${encodeURIComponent(roomName)}`);
        if (response.ok) {
          const { messages: existingMessages } = await response.json();
          setMessages(existingMessages || []);
        } else {
          console.error('Failed to load messages:', response.statusText);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [roomName]);

  // Set up real-time subscription
  useEffect(() => {
    if (!roomName) return;

    const channel = supabase
      .channel(`messages:${roomName}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_name=eq.${roomName}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((current) => {
            // Avoid duplicates
            const exists = current.some(msg => msg.id === newMessage.id);
            if (exists) return current;
            return [...current, newMessage];
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomName, supabase]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user || !content.trim() || !roomName) return;

      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            roomName,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // You might want to show a toast notification here
      }
    },
    [user, roomName]
  );

  return { messages, sendMessage, isConnected, loading };
}