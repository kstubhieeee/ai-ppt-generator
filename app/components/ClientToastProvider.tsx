'use client';

import { ToastProvider } from './ui/toast';

export default function ClientToastProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <ToastProvider>{children}</ToastProvider>;
} 