'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { usePersistentChat } from '@/hooks/use-persistent-chat';
import { BarberDashboard } from '../components/BarberDashboard';

const BARBER_EMAIL = 'bushatia777@gmail.com';

export default function MessagesPage() {
  const { user, isLoaded } = useUser();
  const [roomName, setRoomName] = useState('');
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (isLoaded && user) {
      const userEmail = user.emailAddresses[0]?.emailAddress;
      if (userEmail && userEmail !== BARBER_EMAIL) {
        // Client creates room with barber
        const emails = [userEmail, BARBER_EMAIL].sort();
        setRoomName(`chat:${emails.join('|')}`);
      }
    }
  }, [isLoaded, user]);

  const {
    messages,
    sendMessage,
    isConnected,
    loading
  } = usePersistentChat({ roomName });

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p>Please sign in to message the barber</p>
        </div>
      </div>
    );
  }

  const userEmail = user.emailAddresses[0]?.emailAddress;
  const isBarber = userEmail === BARBER_EMAIL;

  // Show barber dashboard for barber
  if (isBarber) {
    return <BarberDashboard barberEmail={BARBER_EMAIL} />;
  }

  // Show client chat interface
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-4rem)]">
      <div className="border border-[var(--secondary)] rounded-lg h-full overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Chat Header */}
          <div className="border-b border-[var(--secondary)] p-4 bg-[var(--accent)]">
            <h3 className="font-semibold">Chat with Barber</h3>
            <p className="text-sm text-gray-600">
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'} • 
              {messages.length} messages
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_email === userEmail ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_email === userEmail
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-[var(--secondary)] p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!isConnected || !newMessage.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}