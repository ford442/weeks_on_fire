import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * A string filter stored in the URL query (`?key=value`), so filters survive reloads, links, and
 * tab switches. The fallback value is left out of the URL to keep links short.
 */
export function useUrlParam<T extends string = string>(
  key: string,
  fallback: NoInfer<T>,
  allowed?: readonly T[],
): [T, (value: T) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key);
  const value =
    raw !== null && (!allowed || (allowed as readonly string[]).includes(raw))
      ? (raw as T)
      : fallback;

  const setValue = useCallback(
    (next: T) => {
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (next === fallback || next === '') updated.delete(key);
          else updated.set(key, next);
          return updated;
        },
        { replace: true },
      );
    },
    [fallback, key, setParams],
  );

  return [value, setValue];
}

/** Boolean flag stored as `?key=1`. */
export function useUrlFlag(key: string): [boolean, (value: boolean) => void] {
  const [value, setValue] = useUrlParam<'' | '1'>(key, '', ['', '1']);
  const setFlag = useCallback((next: boolean) => setValue(next ? '1' : ''), [setValue]);
  return [value === '1', setFlag];
}
