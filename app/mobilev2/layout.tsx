import React from 'react';

export const metadata = {
  title: 'TimezonePulse Mobile V2',
  description: 'Desktop view of TimezonePulse for mobile devices',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 2,
  userScalable: true,
};

export default function MobileV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 