import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant?: string;
};

type ToastContextValue = {
  toast: (input: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((input: Omit<Toast, 'id'>) => {
    const id = Date.now();
    setItems((current) => [...current.slice(-2), { ...input, id }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3600);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="app-toast-viewport" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={`app-toast ${item.variant === 'destructive' ? 'app-toast-error' : ''}`} role="status">
            <strong>{item.title}</strong>
            {item.description && <span>{item.description}</span>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}