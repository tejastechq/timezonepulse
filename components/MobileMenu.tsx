'use client';

import React, { useEffect, useRef } from 'react';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { Menu, Settings, Info, X, Home, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import StatusIndicator from '@/components/StatusIndicator';

export function MobileMenu() {
  const navRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

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

  const menuItems = [
    { href: '/', label: 'Home', icon: <Home size={20} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
    { href: '/about', label: 'About', icon: <Info size={20} /> },
  ];

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
          className="fixed bottom-0 left-0 top-0 flex h-full w-[80%] flex-col rounded-r-lg bg-background text-foreground z-50 shadow-xl"
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
          
          {/* Header with logo and close button */}
          <div className="border-b border-border/40 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">TimeZonePulse</h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDrawerClose} 
              aria-label="Close menu"
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X size={18} />
            </Button>
          </div>
          
          {/* Main navigation */}
          <div className="flex-1 overflow-y-auto p-2">
            <nav className="flex flex-col space-y-1" ref={navRef}>
              {menuItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'hover:bg-muted/60 text-foreground'
                    }`}
                    onClick={handleDrawerClose}
                    ref={index === 0 ? firstLinkRef : undefined}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight size={16} className="text-primary" />}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Footer section */}
          <div className="border-t border-border/40 p-4">
            <div className="mb-3 flex justify-center">
              <StatusIndicator />
            </div>
            <div className="text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} TimeZonePulse
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
