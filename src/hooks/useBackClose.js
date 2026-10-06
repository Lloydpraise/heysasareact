import { useEffect, useRef } from 'react';

// Makes the phone's Back button / back-swipe close the top-most overlay
// (bottom sheet, lead detail, drawer) instead of leaving the screen.
//
// Every open overlay pushes one history entry and registers itself on a stack.
// A single global popstate listener closes whichever overlay is on top. When an
// overlay is closed from the UI (X button, backdrop, swipe), its history entry
// is popped silently so the Back button stays in sync.

const stack = [];
let ignoreNextPop = 0;
let listening = false;
let nextId = 1;

function onPopState() {
  if (ignoreNextPop > 0) {
    ignoreNextPop -= 1;
    return;
  }
  const layer = stack.pop();
  if (layer) layer.close();
}

function ensureListener() {
  if (listening || typeof window === 'undefined') return;
  window.addEventListener('popstate', onPopState);
  listening = true;
}

export function useBackClose(open, onClose) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    if (!open) return undefined;
    ensureListener();

    const id = nextId++;
    const layer = { id, close: () => closeRef.current?.() };
    stack.push(layer);
    window.history.pushState({ heysasaLayer: id }, '', window.location.href);

    return () => {
      const index = stack.indexOf(layer);
      if (index === -1) return; // already closed by the Back button
      stack.splice(index, 1);
      if (window.history.state?.heysasaLayer === id) {
        ignoreNextPop += 1;
        window.history.back();
      }
    };
  }, [open]);
}

export default useBackClose;
