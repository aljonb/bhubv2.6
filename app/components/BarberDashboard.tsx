'use client';

import { useState } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';

interface BarberDashboardProps {
  barberEmail: string;
}

export function BarberDashboard({ barberEmail }: BarberDashboardProps) {
  const [selectedRoomName, setSelectedRoomName] = useState<string>('');
  const [selectedClientName, setSelectedClientName] = useState<string>('');

  const handleSelectConversation = (roomName: string, clientName: string) => {
    setSelectedRoomName(roomName);
    setSelectedClientName(clientName);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 h-[calc(100vh-4rem)]">
      <div className="border border-gray-200 rounded-lg h-full overflow-hidden">
        <div className="h-full flex">
          {/* Conversations Sidebar */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <div className="border-b border-gray-200 p-4 bg-gray-50">
              <h2 className="font-semibold">Client Messages</h2>
              <p className="text-sm text-gray-600">Manage all client conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ConversationList
                onSelectConversation={handleSelectConversation}
                selectedRoomName={selectedRoomName}
              />
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1">
            {selectedRoomName ? (
              <ChatWindow
                roomName={selectedRoomName}
                clientName={selectedClientName}
                barberEmail={barberEmail}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500">
                    Choose a client conversation from the sidebar to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 