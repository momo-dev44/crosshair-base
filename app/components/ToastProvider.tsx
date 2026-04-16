"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface ToastCtx {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastCtx>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast — bottom-right, slide-up on appear */}
      <div
        role="status"
        aria-live="polite"
        className={[
          "fixed bottom-6 right-6 z-[9999] flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-[#0b1d2b] px-4 py-2.5 text-[13px] font-semibold text-cyan-300 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-sm",
          "transition-all duration-300 ease-out",
          visible
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none",
        ].join(" ")}
      >
        {/* check icon */}
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/15">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 8l4 4 8-8" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {message}
      </div>
    </ToastContext.Provider>
  );
}
