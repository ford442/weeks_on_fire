import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';

import { useEscapeKey } from '../hooks/useEscapeKey';

const minWidth = 340;
const keyboardStep = 40;

function maxWidth() {
  return Math.max(minWidth, Math.min(1100, Math.round(window.innerWidth * 0.7)));
}

function clamp(width: number) {
  return Math.min(Math.max(width, minWidth), maxWidth());
}

function readStoredWidth(storageKey: string, fallback: number) {
  try {
    const stored = Number(localStorage.getItem(storageKey));
    return Number.isFinite(stored) && stored > 0 ? stored : fallback;
  } catch {
    return fallback;
  }
}

interface WorkspaceLayoutProps {
  /** Heading shown above the detail panel. */
  label: ReactNode;
  /** localStorage key for the remembered panel width. */
  storageKey: string;
  defaultWidth?: number;
  list: ReactNode;
  panel: ReactNode;
  /** Below `lg`, the panel is a bottom sheet that is only shown while this is true. */
  sheetOpen: boolean;
  onSheetClose: () => void;
}

/**
 * List + detail layout. On desktop the detail panel is resizable (drag or arrow keys on the
 * divider) and can expand to a full-width reading view for long prompts and lyrics. Below `lg`
 * it becomes a dismissible bottom sheet.
 */
export default function WorkspaceLayout({
  label,
  storageKey,
  defaultWidth = 480,
  list,
  panel,
  sheetOpen,
  onSheetClose,
}: WorkspaceLayoutProps) {
  const [width, setWidth] = useState(() => readStoredWidth(storageKey, defaultWidth));
  const [expanded, setExpanded] = useState(false);
  const dragStart = useRef<{ x: number; width: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(width));
    } catch {
      // Private mode or blocked storage: the width just isn't remembered.
    }
  }, [storageKey, width]);

  useEffect(() => {
    const onResize = () => setWidth((current) => clamp(current));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEscapeKey(
    useCallback(() => {
      if (sheetOpen) onSheetClose();
    }, [onSheetClose, sheetOpen]),
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, width };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    // The panel sits on the right, so dragging left widens it.
    setWidth(clamp(dragStart.current.width + dragStart.current.x - event.clientX));
  };

  const onPointerUp = () => {
    dragStart.current = null;
  };

  const onDividerKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') setWidth((current) => clamp(current + keyboardStep));
    else if (event.key === 'ArrowRight') setWidth((current) => clamp(current - keyboardStep));
    else if (event.key === 'Home') setWidth(maxWidth());
    else if (event.key === 'End') setWidth(minWidth);
    else return;
    event.preventDefault();
  };

  return (
    <section
      style={{ '--panel-width': `${width}px` } as React.CSSProperties}
      className={`mx-auto grid gap-6 px-4 py-6 sm:px-6 lg:px-8 ${
        expanded
          ? 'max-w-5xl'
          : 'max-w-[1600px] lg:grid-cols-[minmax(0,1fr)_auto_var(--panel-width)] lg:gap-0'
      }`}
    >
      <div className={`min-w-0 lg:pr-3 ${expanded ? 'lg:hidden' : ''}`}>{list}</div>

      {!expanded && (
        // A focusable separator is the ARIA window-splitter pattern; jsx-a11y treats it as static.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize detail panel"
          aria-valuenow={width}
          aria-valuemin={minWidth}
          aria-valuemax={1100}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onDividerKey}
          onDoubleClick={() => setWidth(clamp(defaultWidth))}
          title="Drag to resize · double-click to reset"
          className="group hidden w-3 cursor-col-resize touch-none justify-center focus:outline-none lg:flex"
        >
          <span className="sticky top-0 h-screen w-px bg-zinc-800 transition group-hover:w-0.5 group-hover:bg-orange-400 group-focus-visible:w-0.5 group-focus-visible:bg-orange-300" />
        </div>
      )}

      {sheetOpen && (
        <button
          type="button"
          aria-label="Close details"
          onClick={onSheetClose}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <div
        className={`min-w-0 lg:pl-3 ${
          sheetOpen
            ? 'fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-2xl border-t border-zinc-700 bg-[#0d0d0d] px-3 pb-6 shadow-2xl shadow-black lg:static lg:z-auto lg:max-h-none lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:shadow-none'
            : 'hidden lg:block'
        }`}
      >
        <div className={expanded ? '' : 'lg:sticky lg:top-4'}>
          <div className="sticky top-0 z-10 -mx-3 mb-3 flex items-center gap-2 bg-[#0d0d0d] px-3 pt-2 pb-2 lg:static lg:mx-0 lg:bg-transparent lg:p-0">
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-zinc-700 lg:hidden"
            />
            <div className="mt-2 flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-zinc-300 lg:mt-0">
              {label}
            </div>
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              className="mt-2 hidden items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-sm font-semibold text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 lg:mt-0 lg:inline-flex"
            >
              {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              {expanded ? 'Back to list' : 'Full view'}
            </button>
            <button
              type="button"
              onClick={onSheetClose}
              aria-label="Close details"
              className="mt-2 rounded-md p-1.5 text-zinc-300 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-300 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>
          <div
            className={
              expanded ? '' : 'lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:overscroll-contain'
            }
          >
            {panel}
          </div>
        </div>
      </div>
    </section>
  );
}
