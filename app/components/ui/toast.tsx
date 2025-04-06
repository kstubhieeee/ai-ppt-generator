'use client';

import * as React from 'react';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

type ToastContextType = {
  toast: (props: ToastProps) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const toast = React.useCallback((props: ToastProps) => {
    const id = Date.now();
    setToasts((prev) => [...prev, props]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((_, i) => i !== 0));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t, i) => (
          <div
            key={i}
            className={`p-4 rounded-md shadow-md text-sm max-w-md transition-all ${
              t.variant === 'destructive' ? 'bg-red-500 text-white' : 'bg-white text-black border'
            }`}
          >
            {t.title && <div className="font-semibold mb-1">{t.title}</div>}
            {t.description && <div>{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const toast = (props: ToastProps) => {
  console.log('Toast:', props);
  // This is a simpler implementation for direct use
  // In a real app, this would use a proper state management system
  const toastEl = document.createElement('div');
  toastEl.className = `fixed bottom-4 right-4 z-50 p-4 rounded-md shadow-md text-sm max-w-md transition-all ${
    props.variant === 'destructive' ? 'bg-red-500 text-white' : 'bg-white text-black border'
  }`;

  if (props.title) {
    const titleEl = document.createElement('div');
    titleEl.className = 'font-semibold mb-1';
    titleEl.textContent = props.title;
    toastEl.appendChild(titleEl);
  }

  if (props.description) {
    const descEl = document.createElement('div');
    descEl.textContent = props.description;
    toastEl.appendChild(descEl);
  }

  document.body.appendChild(toastEl);

  setTimeout(() => {
    toastEl.style.opacity = '0';
    setTimeout(() => {
      toastEl.remove();
    }, 300);
  }, 5000);
}; 