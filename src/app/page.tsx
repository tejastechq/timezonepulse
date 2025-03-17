"use client";

import { useState } from 'react';
import { ListView } from '@/components/ListView';
import { getCommonTimezones } from '@/lib/timezone-utils';

export default function Home() {
  const [activeTab, setActiveTab] = useState('list');
  const timezones = getCommonTimezones();
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-center">World Clock</h1>
      </header>
      
      <nav className="flex p-2 bg-gray-800">
        <button 
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'list' ? 'bg-blue-500' : 'bg-transparent'}`}
        >
          <span className="mr-2">☰</span> List
        </button>
        <button 
          onClick={() => setActiveTab('clocks')}
          className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'clocks' ? 'bg-blue-500' : 'bg-transparent'}`}
        >
          <span className="mr-2">⏱</span> Clocks
        </button>
        <button 
          onClick={() => setActiveTab('digital')}
          className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'digital' ? 'bg-blue-500' : 'bg-transparent'}`}
        >
          <span className="mr-2">🔢</span> Digital
        </button>
      </nav>
      
      <main className="p-4">
        {activeTab === 'list' && <ListView timezones={timezones} showBusinessHours={true} />}
        {activeTab === 'clocks' && <div>Clocks View (Not Implemented)</div>}
        {activeTab === 'digital' && <div>Digital View (Not Implemented)</div>}
      </main>
    </div>
  );
} 