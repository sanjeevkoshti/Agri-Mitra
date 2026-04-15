import React, { createContext, useContext, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState(null);

  const showConfirm = (message) => {
    return new Promise((resolve) => {
      setConfirmState({
        message,
        onConfirm: () => {
          resolve(true);
          setConfirmState(null);
        },
        onCancel: () => {
          resolve(false);
          setConfirmState(null);
        }
      });
    });
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      {confirmState && (
        <div className="fixed inset-0 bg-primary-dark/80 backdrop-blur-xl flex items-center justify-center p-4 z-[9999] animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] border border-white/20 relative overflow-hidden text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-primary-dark uppercase tracking-tight mb-2">Confirm Action</h3>
            <p className="text-sm font-bold text-text-muted leading-relaxed mb-8">{confirmState.message}</p>
            <div className="flex gap-4">
              <button 
                onClick={confirmState.onCancel}
                className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmState.onConfirm}
                className="flex-1 btn btn-primary py-4 rounded-2xl font-black uppercase shadow-hard text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
