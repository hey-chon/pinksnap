import { useEffect } from 'react';
import { X } from 'lucide-react';
import { AuthModal } from './auth-modal';

interface AuthGateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthGateModal({ onClose, onSuccess }: AuthGateModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label="Sign in required"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign-in dialog"
          className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full shadow-md border border-black/10 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <AuthModal initialMode="signup" onSuccess={onSuccess} />
      </div>
    </div>
  );
}
