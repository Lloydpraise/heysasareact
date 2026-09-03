import React from 'react';

export function Toast({ toast }) {
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      className={`fixed left-1/2 top-5 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-center text-sm font-semibold shadow-2xl transition-all ${
        isError
          ? 'border-red-400 bg-red-500/90 text-white'
          : 'border-emerald-300 bg-emerald-500 text-white shadow-emerald-500/25'
      }`}
    >
      {toast.message}
    </div>
  );
}