'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { RealtimeChat } from '@/components/realtime-chat';

export default function TestMessagesPage() {
  const { user, isLoaded } = useUser();
  const [selectedRoom, setSelectedRoom] = useState('general');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (isLoaded && user) {
      // Use email as identifier (first part before @)
      const email = user.emailAddresses[0]?.emailAddress;
      const displayName = email ? email.split('@')[0] : user.firstName || 'Anonymous';
      setUsername(displayName);
    }
  }, [isLoaded, user]);

  if (!isLoaded) {
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
          <p>Please sign in to test real-time chat</p>
        </div>
      </div>
    );
  }

  const testRooms = [
    { id: 'general', name: 'General Chat', description: 'Open discussion' },
    { id: 'barber-client', name: 'Barber-Client', description: 'Service discussions' },
    { id: 'appointments', name: 'Appointments', description: 'Booking related' },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-6xl mx-auto p-4 gap-4">
      {/* Room Selection Sidebar */}
      <div className="w-80 border border-[var(--secondary)] rounded-lg p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Test Chat Rooms</h2>
          <div className="text-sm text-gray-600 mb-4">
            <p><strong>User:</strong> {username}</p>
            <p><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          {testRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedRoom === room.id
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--accent)] border-[var(--secondary)] hover:bg-[var(--secondary)]'
              }`}
            >
              <div className="font-medium">{room.name}</div>
              <div className="text-xs opacity-75">{room.description}</div>
            </button>
          ))}
        </div>

        <div className="mt-6 p-3 bg-[var(--accent)] rounded-lg text-sm">
          <h3 className="font-medium mb-2">How to Test:</h3>
          <ul className="space-y-1 text-xs">
            <li>• Open this page in multiple tabs/browsers</li>
            <li>• Sign in with different accounts</li>
            <li>• Select the same room</li>
            <li>• Send messages to see real-time sync</li>
          </ul>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 border border-[var(--secondary)] rounded-lg overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Chat Header */}
          <div className="border-b border-[var(--secondary)] p-4 bg-[var(--accent)]">
            <h3 className="font-semibold">
              {testRooms.find(r => r.id === selectedRoom)?.name}
            </h3>
            <p className="text-sm text-gray-600">
              Room: {selectedRoom} • Connected as: {username}
            </p>
          </div>

          {/* Real-time Chat Component */}
          <div className="flex-1">
            <RealtimeChat
              roomName={selectedRoom}
              username={username}
              onMessage={(messages) => {
                // Optional: Handle message persistence here
                console.log('Messages updated:', messages.length);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
