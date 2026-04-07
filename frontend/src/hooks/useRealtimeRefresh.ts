import { useCallback, useEffect, useRef, useState } from 'react';

interface UseRealtimeRefreshOptions {
  enabled?: boolean;
  intervalMs: number;
  onRefresh: () => Promise<unknown> | unknown;
}

export const useRealtimeRefresh = ({
  enabled = true,
  intervalMs,
  onRefresh,
}: UseRealtimeRefreshOptions) => {
  const onRefreshRef = useRef(onRefresh);
  const isRefreshingRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [lastRefreshError, setLastRefreshError] = useState<string | null>(null);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const refreshNow = useCallback(async () => {
    if (!enabled || isRefreshingRef.current) {
      return false;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    try {
      await onRefreshRef.current();
      setLastRefreshError(null);
      setLastUpdatedAt(new Date());
      return true;
    } catch (error) {
      setLastRefreshError(error instanceof Error ? error.message : 'Refresh failed');
      return false;
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) {
      return undefined;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    let isCancelled = false;

    const scheduleNextRefresh = () => {
      timeoutId = setTimeout(async () => {
        const isPageVisible =
          typeof document === 'undefined' || document.visibilityState === 'visible';

        if (isPageVisible) {
          await refreshNow();
        }

        if (!isCancelled) {
          scheduleNextRefresh();
        }
      }, intervalMs);
    };

    scheduleNextRefresh();

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [enabled, intervalMs, refreshNow]);

  return {
    isRefreshing,
    lastRefreshError,
    lastUpdatedAt,
    refreshNow,
  };
};
