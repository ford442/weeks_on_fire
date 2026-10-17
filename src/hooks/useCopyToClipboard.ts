import { useCallback, useState } from 'react';

const COPIED_RESET_MS = 1600;

/** Clipboard copy with a transient `copiedKey` for "Copied" button states. */
export function useCopyToClipboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = useCallback((text: string, label: string, key: string): void => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedKey(key);
        window.setTimeout(() => setCopiedKey(null), COPIED_RESET_MS);
      },
      () => {
        window.prompt(`Copy ${label}`, text);
      },
    );
  }, []);

  return { copiedKey, copy };
}
