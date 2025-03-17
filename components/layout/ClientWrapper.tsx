'use client';

import React from 'react';
import { Providers } from '@/app/providers';
import ClientLayout from '@/components/layout/ClientLayout';

/**
 * Client wrapper component
 * This combines Providers and ClientLayout in a single client component
 * to prevent 'use client' hoisting to the main layout
 */
export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <ClientLayout>
        {children}
      </ClientLayout>
    </Providers>
  );
} 