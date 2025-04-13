'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChatMessage } from '../components/ChatMessage';

// Sample barbers for the messaging interface
const barbers = [
  { id: '1', name: 'Mike Johnson', image: 'https://randomuser.me/api/portraits/men/32.jpg', lastMessage: 'Your appointment is confirmed for tomorrow at 10 AM.' },
  { id: '2', name: 'David Smith', image: 'https://randomuser.me/api/portraits/men/44.jpg', lastMessage: 'Looking forward to seeing you on Tuesday!' },
  { id: '3', name: 'Sarah Wilson', image: 'https://randomuser.me/api/portraits/women/65.jpg', lastMessage: 'Thank you for your visit yesterday.' },
];

// Sample chat history
const sampleChatHistory = [
  { id: '1', message: 'Hi there! I\'d like to confirm my appointment for tomorrow.', sender: 'client' as const, timestamp: '10:15 AM' },
  { id: '2', message: 'Hello! Yes, you\'re scheduled for a haircut at 10 AM tomorrow.', sender: 'barber' as const, timestamp: '10:17 AM' },
  { id: '3', message: 'Do I need to bring anything specific?', sender: 'client' as const, timestamp: '10:18 AM' },
  { id: '4', message: 'No need to bring anything special. Just come as you are!', sender: 'barber' as const, timestamp: '10:20 AM' },
  { id: '5', message: 'Great, thank you! See you tomorrow.', sender: 'client' as const, timestamp: '10:22 AM' },
  { id: '6', message: 'Looking forward to it! Have a great day.', sender: 'barber' as const, timestamp: '10:23 AM' },
];

export default function MessagesPage() {
  const [selectedBarber, setSelectedBarber] = useState(barbers[0]);
  const [messages, setMessages] = useState(sampleChatHistory);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setMessages([
      ...messages,
      {
        id: (messages.length + 1).toString(),
        message: newMessage,
        sender: 'client',
        timestamp,
      },
    ]);
    
    setNewMessage('');
    
    // Simulate a response from the barber
    setTimeout(() => {
      const responses = [
        'Got it, thanks for letting me know!',
        'I\'ll make a note of that.',
        'Perfect! See you at your appointment.',
        'Is there anything else you need?'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: (prevMessages.length + 1).toString(),
          message: randomResponse,
          sender: 'barber',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 2000);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden">
      {/* Barber List Sidebar */}
      <div className="w-80 border-r border-[var(--secondary)] overflow-y-auto">
        <div className="p-4 border-b border-[var(--secondary)]">
          <h2 className="text-lg font-semibold">Messages</h2>
        </div>
        <div>
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-[var(--accent)] transition-colors ${
                selectedBarber.id === barber.id ? 'bg-[var(--accent)]' : ''
              }`}
              onClick={() => setSelectedBarber(barber)}
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-full">
                <Image
                  src={barber.image}
                  alt={barber.name}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-medium">{barber.name}</h3>
                <p className="text-sm text-gray-500 truncate">{barber.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center gap-4 p-4 border-b border-[var(--secondary)]">
          <div className="relative h-10 w-10 overflow-hidden rounded-full">
            <Image
              src={selectedBarber.image}
              alt={selectedBarber.name}
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="font-medium">{selectedBarber.name}</h3>
            <p className="text-xs text-gray-500">Barber</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg.message}
              sender={msg.sender}
              timestamp={msg.timestamp}
              senderImage={msg.sender === 'barber' ? selectedBarber.image : undefined}
            />
          ))}
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="border-t border-[var(--secondary)] p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 rounded-full border border-[var(--secondary)] bg-[var(--accent)] px-4 py-2"
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--primary)] p-2 text-white"
              disabled={!newMessage.trim()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 