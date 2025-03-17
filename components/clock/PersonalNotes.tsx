'use client';

import React, { useState } from 'react';
import { useIntegrations, PersonalNote } from '@/app/contexts/IntegrationsContext';
import { DateTime } from 'luxon';

interface PersonalNotesProps {
  timezone: string;
}

/**
 * PersonalNotes component for displaying and managing personal notes for a timezone
 */
export default function PersonalNotes({ timezone }: PersonalNotesProps) {
  const { getPersonalNotesForTimezone, addPersonalNote, removePersonalNote } = useIntegrations();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  
  // Get personal notes for the timezone
  const notes = getPersonalNotesForTimezone(timezone);
  
  // Handle adding a new note
  const handleAddNote = () => {
    if (newNoteText.trim()) {
      addPersonalNote({
        timezone,
        text: newNoteText.trim()
      });
      setNewNoteText('');
      setIsAddingNote(false);
    }
  };
  
  // Handle removing a note
  const handleRemoveNote = (id: string) => {
    removePersonalNote(id);
  };
  
  // Format the date for display
  const formatDate = (dateString: string) => {
    return DateTime.fromISO(dateString).toFormat('MMM d, yyyy');
  };
  
  return (
    <div className="mt-4 text-sm">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium">Personal Notes</h4>
        <button
          onClick={() => setIsAddingNote(!isAddingNote)}
          className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {isAddingNote ? 'Cancel' : 'Add Note'}
        </button>
      </div>
      
      {/* Add note form */}
      {isAddingNote && (
        <div className="mb-3">
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Enter your note here..."
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={3}
          />
          <div className="flex justify-end mt-1">
            <button
              onClick={handleAddNote}
              disabled={!newNoteText.trim()}
              className="px-3 py-1 text-xs bg-primary-500 text-white rounded-md disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      )}
      
      {/* Notes list */}
      {notes.length > 0 ? (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
              <div className="flex justify-between items-start">
                <p className="text-gray-800 dark:text-gray-200">{note.text}</p>
                <button
                  onClick={() => handleRemoveNote(note.id)}
                  className="ml-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                  aria-label="Remove note"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Added on {formatDate(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 italic">No notes yet</p>
      )}
    </div>
  );
} 