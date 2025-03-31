'use client';

import React, { useEffect, useRef } from 'react';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react'; // Assuming lucide-react is used for icons

export function MobileMenu() {
  const navRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  // Handle focus when drawer opens
  useEffect(() => {
    if (isOpen && firstLinkRef.current) {
      // Set focus on first interactive element when drawer opens
      setTimeout(() => {
        firstLinkRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle drawer close to fix background issues
  const handleDrawerClose = () => {
    // Reset body background style that might have been set by Vaul
    document.body.style.background = '';
    setIsOpen(false);
  };

  return (
    <Drawer.Root 
      direction="left" 
      open={isOpen} 
      onOpenChange={(open) => open ? setIsOpen(open) : handleDrawerClose()}
      shouldScaleBackground={false}
    >
      <Drawer.Trigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          aria-label="Open navigation menu"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content 
          className="fixed bottom-0 left-0 top-0 mt-24 flex h-full w-[80%] flex-col rounded-t-[10px] bg-background text-foreground z-50"
          role="dialog"
          aria-modal="true"
          id="mobile-navigation"
          style={{
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'optimizeLegibility'
          }}
        >
          {/* Add a proper visible title for accessibility */}
          <Drawer.Title className="sr-only">Mobile Navigation Menu</Drawer.Title>
          <div className="mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted" />
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="flex flex-col space-y-4" ref={navRef}>
              {/* Use ref for focus management, remove autoFocus which can cause issues */}
              <a 
                href="/settings" 
                className="text-lg font-medium text-foreground hover:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                ref={firstLinkRef}
              >
                Settings
              </a>
              <a 
                href="/about" 
                className="text-lg font-medium text-foreground hover:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                About
              </a>
              {/* Close button for keyboard users */}
              <button
                className="mt-4 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-foreground hover:bg-muted transition-colors"
                onClick={handleDrawerClose}
              >
                Close Menu
              </button>
            </nav>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
