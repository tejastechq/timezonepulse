// Global type declarations for the project

// Extend the Window interface to include our custom properties
interface Window {
  // Vercel Analytics and Speed Insights
  __VERCEL_INSIGHTS?: {
    disconnect?: () => void;
    reconnect?: () => void;
    [key: string]: any;
  };
  
  __SPEED_INSIGHTS?: {
    disconnect?: () => void;
    reconnect?: () => void;
    [key: string]: any;
  };
  
  // Request Idle Callback API
  requestIdleCallback: (
    callback: (deadline: {
      didTimeout: boolean;
      timeRemaining: () => number;
    }) => void,
    opts?: { timeout: number }
  ) => number;
  
  cancelIdleCallback: (id: number) => void;
}

// Make TypeScript recognize custom events
interface CustomEventMap {
  'bfcacherestored': CustomEvent;
  'refresh-after-bfcache': CustomEvent;
}

// Extend the type of the addEventListener function
interface WindowEventMap extends CustomEventMap {}

// Declare module augmentation for bfcache-related metadata
declare module 'next' {
  interface Metadata {
    other?: {
      'bfcache-eligible'?: string;
      'priority'?: string;
      [key: string]: string | undefined;
    };
  }
} 