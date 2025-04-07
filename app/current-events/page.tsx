import React from 'react';
import CurrentEventsView from '../../components/views/CurrentEventsView';

export default function CurrentEventsPage() {
  return (
    <main className="flex flex-col items-center justify-start min-h-screen p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Current Events</h1>
      <CurrentEventsView />
    </main>
  );
}
