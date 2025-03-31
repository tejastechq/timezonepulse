'use client';

import React from 'react';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react'; // Assuming lucide-react is used for icons

export function MobileMenu() {
  return (
    <Drawer.Root direction="left">
      <Drawer.Trigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 top-0 mt-24 flex h-full w-[80%] flex-col rounded-t-[10px] bg-background">
          <div className="mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted" />
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="flex flex-col space-y-4">
              {/* TODO: Add actual navigation links here */}
              <a href="/settings" className="text-lg font-medium text-foreground hover:text-muted-foreground">
                Settings
              </a>
              <a href="/about" className="text-lg font-medium text-foreground hover:text-muted-foreground">
                About
              </a>
              {/* Add more links as needed */}
            </nav>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
