import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

// A simple utility to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Intercept removal to play exit animation?
    // We rely on component unmount and minimal state, but we could use a timeout if we want.
    // For now, we'll keep it simple: enter animation natively via Tailwind.
  }, []);

  let Icon;
  let bgClass;
  let borderClass;
  
  if (toast.type === 'success') {
    Icon = CheckCircle;
    bgClass = 'bg-emerald-500/90';
    borderClass = 'border-emerald-400';
  } else if (toast.type === 'error') {
    Icon = AlertCircle;
    bgClass = 'bg-red-500/90';
    borderClass = 'border-red-400';
  } else {
    Icon = Info;
    bgClass = 'bg-primary/90';
    borderClass = 'border-primary-light';
  }

  return (
    <div 
      className={`pointer-events-auto flex items-center justify-between gap-3 px-6 py-4 rounded-full shadow-[0_12px_40px_-10px_rgba(0,0,0,0.3)] backdrop-blur-md border ${bgClass} ${borderClass} text-white animate-in slide-in-from-top-4 fade-in duration-300 transform transition-all hover:scale-[1.02]`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="font-bold text-sm tracking-wide leading-tight">{toast.message}</span>
      </div>
      <button 
        onClick={onRemove}
        className="ml-2 hover:bg-white/20 p-1.5 rounded-full transition-colors focus:outline-none flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
