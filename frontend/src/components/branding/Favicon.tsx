'use client';

import { useEffect } from 'react';

interface FaviconProps {
  href?: string;
}

export default function Favicon({ href = '/favicon.svg' }: FaviconProps) {
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
  }, [href]);

  return null;
}