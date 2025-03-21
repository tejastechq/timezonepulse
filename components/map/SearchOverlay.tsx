'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { TIMEZONE_REGIONS } from '@/utils/mapUtils';

// SVG paths for search and close icons
const SEARCH_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const CLOSE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

type SearchResult = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  matchScore: number;
};

interface SearchOverlayProps {
  onSelectTimezone: (timezoneId: string, coordinates: [number, number]) => void;
}

/**
 * SearchOverlay Component
 * 
 * A search input that allows users to find specific cities and timezones.
 * Features fuzzy search, keyboard navigation, and mobile-friendly design.
 */
export const SearchOverlay = ({ onSelectTimezone }: SearchOverlayProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const highlightedResultRef = useRef<HTMLDivElement>(null);
  
  const toggleSearch = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      setResults([]);
    }
  };
  
  // Fuzzy search function that scores matches
  const fuzzyMatch = (text: string, pattern: string): number => {
    if (!pattern) return 0;
    
    const lowerText = text.toLowerCase();
    const lowerPattern = pattern.toLowerCase();
    
    // Exact match gets highest score
    if (lowerText === lowerPattern) return 100;
    
    // Starts with pattern gets high score
    if (lowerText.startsWith(lowerPattern)) return 80;
    
    // Contains full pattern gets medium score
    if (lowerText.includes(lowerPattern)) return 60;
    
    // Check if all characters in pattern appear in text in order
    let lastIndex = -1;
    let allCharsMatch = true;
    
    for (const char of lowerPattern) {
      const index = lowerText.indexOf(char, lastIndex + 1);
      if (index === -1) {
        allCharsMatch = false;
        break;
      }
      lastIndex = index;
    }
    
    // All characters match in order
    if (allCharsMatch) return 40;
    
    // Word boundary matches (checks if pattern matches beginning of any word)
    const words = lowerText.split(/\s+/);
    for (const word of words) {
      if (word.startsWith(lowerPattern)) return 30;
    }
    
    return 0;
  };
  
  // Filter and sort results based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    const matches = TIMEZONE_REGIONS
      .map(region => ({
        ...region,
        matchScore: Math.max(
          fuzzyMatch(region.name, searchQuery),
          fuzzyMatch(region.id.replace(/_/g, ' ').replace(/\//g, ' '), searchQuery)
        )
      }))
      .filter(region => region.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
    
    setResults(matches);
    setHighlightedIndex(matches.length > 0 ? 0 : -1);
  }, [searchQuery]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : prev
        );
        break;
        
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          const selected = results[highlightedIndex];
          handleSelectResult(selected);
        }
        break;
        
      case 'Escape':
        setIsVisible(false);
        setSearchQuery('');
        break;
        
      default:
        break;
    }
  };
  
  // Handle selecting a search result
  const handleSelectResult = (result: SearchResult) => {
    onSelectTimezone(result.id, [result.lat, result.lng]);
    setIsVisible(false);
    setSearchQuery('');
    setResults([]);
  };
  
  // Scroll to ensure highlighted result is visible
  useEffect(() => {
    if (
      highlightedResultRef.current && 
      resultsRef.current && 
      highlightedIndex >= 0
    ) {
      const resultItem = highlightedResultRef.current;
      const resultsContainer = resultsRef.current;
      
      const itemTop = resultItem.offsetTop;
      const itemHeight = resultItem.offsetHeight;
      const containerTop = resultsContainer.scrollTop;
      const containerHeight = resultsContainer.offsetHeight;
      
      if (itemTop < containerTop) {
        resultsContainer.scrollTop = itemTop;
      } else if (itemTop + itemHeight > containerTop + containerHeight) {
        resultsContainer.scrollTop = itemTop + itemHeight - containerHeight;
      }
    }
  }, [highlightedIndex]);
  
  return (
    <div className="absolute top-4 right-4 z-10">
      {/* Search toggle button */}
      <button 
        onClick={toggleSearch} 
        className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md text-gray-700 hover:bg-gray-100 focus:outline-none"
        aria-label="Toggle search"
      >
        {isVisible ? CLOSE_ICON : SEARCH_ICON}
      </button>
      
      {/* Search overlay */}
      {isVisible && (
        <div className="absolute right-0 top-12 w-72 bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-2">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for a city or timezone..."
                className="w-full p-2 pl-9 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute top-2.5 left-3 text-gray-400">
                {SEARCH_ICON}
              </span>
            </div>
          </div>
          
          {results.length > 0 && (
            <div 
              ref={resultsRef}
              className="max-h-64 overflow-y-auto divide-y divide-gray-200"
            >
              {results.map((result, index) => (
                <div
                  key={result.id}
                  ref={index === highlightedIndex ? highlightedResultRef : null}
                  className={`p-3 cursor-pointer ${
                    index === highlightedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectResult(result)}
                >
                  <div className="font-medium">{result.name}</div>
                  <div className="text-xs text-gray-500">{result.id.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchOverlay; 