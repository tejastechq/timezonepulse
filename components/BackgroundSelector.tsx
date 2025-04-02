'use client';

import { useState, useEffect, useCallback } from 'react';

type BackgroundOption = {
  id: string;
  name: string;
  description: string;
};

const backgroundOptions: BackgroundOption[] = [
  {
    id: 'clock',
    name: 'Clock-inspired',
    description: 'Subtle clock patterns with soft gradients'
  },
  {
    id: 'world-map',
    name: 'World Map',
    description: 'Dotted pattern resembling a world map with longitude and latitude lines'
  },
  {
    id: 'day-night-cycle',
    name: 'Day-Night Cycle',
    description: 'Beautiful gradient that transitions through colors of day and night'
  },
  {
    id: 'geometric',
    name: 'Geometric Modern',
    description: 'Contemporary design with geometric shapes and subtle animation'
  },
  {
    id: 'blueprint',
    name: 'Tech Blueprint',
    description: 'Technical blueprint-style grid with precision elements'
  },
  {
    id: 'vibrant',
    name: 'Vibrant Gradient',
    description: 'Energetic animated background with colorful gradients'
  }
];

export default function BackgroundSelector() {
  const [selectedBackground, setSelectedBackground] = useState<string>('clock');
  const [isOpen, setIsOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [preloadedBackgrounds, setPreloadedBackgrounds] = useState<Set<string>>(new Set(['clock']));

  useEffect(() => {
    // Get saved preference from localStorage if available
    const savedBackground = localStorage.getItem('selected-background');
    if (savedBackground) {
      setSelectedBackground(savedBackground);
      loadBackground(savedBackground, false);
      setPreloadedBackgrounds(prev => {
        const next = new Set(prev);
        next.add(savedBackground);
        return next;
      });
    } else {
      // Default to clock if nothing saved
      loadBackground('clock', false);
    }
    
    // Preload common backgrounds
    preloadBackgrounds(['clock', 'day-night-cycle']);
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); // <-- Remove preloadBackgrounds, it's stable due to useCallback([])

  // Preload backgrounds to improve switching experience
  const preloadBackgrounds = useCallback((backgroundIds: string[]) => {
    backgroundIds.forEach(id => {
      // Use functional update to access previous state without adding dependencies
      setPreloadedBackgrounds(prev => {
        if (!prev.has(id)) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = `/styles/backgrounds/${id}.css`;
          link.as = 'style';
          link.setAttribute('data-background-preload', id);
          document.head.appendChild(link);
          
          const next = new Set(prev);
          next.add(id);
          return next;
        }
        return prev; // Return previous state if already preloaded
      });
    });
  }, []); // Empty dependency array is correct here

  const loadBackground = (backgroundId: string, animate = true) => {
    if (animate) {
      setIsTransitioning(true);
    }

    // Make sure backgroundId is valid
    if (!backgroundOptions.some(opt => opt.id === backgroundId)) {
      console.error(`Invalid background ID: ${backgroundId}`);
      backgroundId = 'clock'; // Fallback to default
    }

    // Check if we already have this background loaded as active
    const currentActive = document.querySelector(`link[data-background-style="${backgroundId}"]`);
    if (currentActive) {
      // Background is already active, just save the preference
      localStorage.setItem('selected-background', backgroundId);
      if (animate) {
        setTimeout(() => setIsTransitioning(false), 300);
      }
      return;
    }

    // Create a new link for the selected background
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/styles/backgrounds/${backgroundId}.css`;
    link.setAttribute('data-background-style', backgroundId);
    
    // Add onload handler before appending to ensure it catches the load event
    link.onload = () => {
      // After new style is loaded, remove previous stylesheets
      const existingLinks = document.querySelectorAll('link[data-background-style]:not([data-background-style="' + backgroundId + '"])');
      existingLinks.forEach(el => el.remove());
      
      if (animate) {
        setTimeout(() => setIsTransitioning(false), 300);
      }
      
      // Save preference to localStorage
      localStorage.setItem('selected-background', backgroundId);
      console.log(`Background switched to: ${backgroundId}`);
    };
    
    // Handle loading errors
    link.onerror = () => {
      console.error(`Failed to load background: ${backgroundId}`);
      if (animate) {
        setIsTransitioning(false);
      }
    };
    
    // Append the link to head to start loading
    document.head.appendChild(link);
  };

  const handleSelectBackground = (backgroundId: string) => {
    if (backgroundId === selectedBackground) {
      setIsOpen(false);
      return;
    }
    
    setSelectedBackground(backgroundId);
    loadBackground(backgroundId);
    setIsOpen(false);
    
    // Preload other backgrounds for future switches
    const otherBackgrounds = backgroundOptions
      .map(opt => opt.id)
      .filter(id => id !== backgroundId && !preloadedBackgrounds.has(id))
      .slice(0, 2); // Preload up to 2 more backgrounds
    
    if (otherBackgrounds.length > 0) {
      preloadBackgrounds(otherBackgrounds);
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-10">
      <div 
        className={`fixed inset-0 bg-black pointer-events-none transition-opacity duration-300 ${
          isTransitioning ? 'opacity-10' : 'opacity-0'
        }`} 
        aria-hidden="true"
      />
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/20 transition-colors shadow-lg"
        aria-label="Background options"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"></path>
          <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path>
          <path d="M12 2v2"></path>
          <path d="M12 22v-2"></path>
          <path d="m17 20.66-1-1.73"></path>
          <path d="M11 10.27 7 3.34"></path>
          <path d="m20.66 17-1.73-1"></path>
          <path d="m3.34 7 1.73 1"></path>
          <path d="M14 12h8"></path>
          <path d="M2 12h2"></path>
          <path d="m20.66 7-1.73 1"></path>
          <path d="m3.34 17 1.73-1"></path>
          <path d="m17 3.34-1 1.73"></path>
          <path d="m11 13.73-4 6.93"></path>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-64 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg overflow-hidden transition-all duration-200 ease-in-out">
          <div className="p-2 bg-black/10 text-sm font-medium text-center">Background Style</div>
          <div className="max-h-60 overflow-y-auto">
            {backgroundOptions.map(option => (
              <button
                key={option.id}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 ${
                  selectedBackground === option.id ? 'bg-primary-500/20 font-medium' : ''
                }`}
                onClick={() => handleSelectBackground(option.id)}
                disabled={isTransitioning}
              >
                {selectedBackground === option.id && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                )}
                <div className={selectedBackground === option.id ? "flex-1" : "flex-1 pl-6"}>
                  <div className="font-medium">{option.name}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
