'use client';

import { useState } from 'react';
import { UserProfile } from '@clerk/nextjs';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('account');

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-8">Profile</h1>

      <div className="flex border-b border-[var(--secondary)] mb-8">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'account'
              ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'preferences'
              ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'notifications'
              ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
      </div>

      {activeTab === 'account' && (
        <div className="space-y-6">
          <UserProfile routing="hash" />
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-medium mb-4">Appointment Preferences</h2>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>Receive reminder 24 hours before appointment</span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>Receive confirmation when appointment is booked</span>
                </label>
              </div>
              
              <div>
                <label htmlFor="preferred-barber" className="block text-sm font-medium mb-2">
                  Preferred Barber
                </label>
                <select
                  id="preferred-barber"
                  className="w-full rounded-md border-[var(--secondary)] p-2"
                >
                  <option value="">No preference</option>
                  <option value="1">Mike Johnson</option>
                  <option value="2">David Smith</option>
                  <option value="3">Sarah Wilson</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-medium mb-4">Notification Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>Email notifications</span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>SMS notifications</span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>Promotional emails about discounts and special offers</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 