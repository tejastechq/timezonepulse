"use client";

import React, { useState, useEffect } from 'react';
import CurrentEventsView from '../../components/views/CurrentEventsView';
import { AnimatePresence, motion } from 'framer-motion';

const availableTopics = ['Technology', 'Sports', 'Politics', 'Entertainment', 'Science'];

export default function CurrentEventsPage() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('preferredTopics');
    if (saved) {
      try {
        setSelectedTopics(JSON.parse(saved));
      } catch {
        setSelectedTopics([]);
      }
    } else {
      setSelectedTopics(availableTopics); // default: all topics
    }
  }, []);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const savePreferences = () => {
    localStorage.setItem('preferredTopics', JSON.stringify(selectedTopics));
    setShowModal(false);
  };

  return (
    <main className="flex flex-col items-center justify-start min-h-screen p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Current Events</h1>
      <button
        onClick={() => setShowModal(true)}
        className="mb-4 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow transition"
      >
        Customize Your Experience
      </button>

      <CurrentEventsView selectedTopics={selectedTopics} />

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h2 className="text-xl font-semibold mb-4">Select Your Topics</h2>
              <div className="flex flex-col gap-3 mb-6">
                {availableTopics.map(topic => (
                  <label key={topic} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic)}
                      onChange={() => toggleTopic(topic)}
                      className="form-checkbox h-5 w-5 text-primary-600"
                    />
                    <span>{topic}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={savePreferences}
                  className="px-4 py-2 rounded bg-primary-600 hover:bg-primary-700 text-white transition"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
