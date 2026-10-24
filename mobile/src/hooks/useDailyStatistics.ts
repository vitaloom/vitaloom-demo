import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { getErrorMessage } from "../api/client";
import { getDailyStatistics, type DailyStatistics } from "../api/dailyStatistics";

const POLL_INTERVAL_MS = 2_000;

export function useDailyStatistics() {
  const [data, setData] = useState<DailyStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState(AppState.currentState === "active");

  const mountedRef = useRef(true);
  const dataRef = useRef<DailyStatistics | null>(null);
  const requestRef = useRef<Promise<void> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        controllerRef.current?.abort();
        setIsActive(false);
      } else {
        setIsActive(true);
      }
    });

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      controllerRef.current?.abort();
      subscription.remove();
    };
  }, []);

  const load = useCallback(async (force = false) => {
    if (!mountedRef.current || AppState.currentState !== "active") {
      return;
    }

    if (requestRef.current) {
      if (!force) {
        await requestRef.current;
        return;
      }
      controllerRef.current?.abort();
      await requestRef.current;
      if (!mountedRef.current || AppState.currentState !== "active") {
        return;
      }
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;

    if (dataRef.current === null) {
      setLoading(true);
    } else if (force) {
      // Only explicit refreshes show the pull-to-refresh / refresh-button spinner.
      // Background polling remains quiet every two seconds.
      setRefreshing(true);
    }

    const request = (async () => {
      try {
        const nextData = await getDailyStatistics(controller.signal);
        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return;
        }
        dataRef.current = nextData;
        setData(nextData);
        setError(null);
        setLastUpdated(new Date());
      } catch (requestError) {
        if (
          controller.signal.aborted ||
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }
        // Keep the last successful data visible if a later poll fails.
        setError(getErrorMessage(requestError));
      } finally {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();

    requestRef.current = request;
    await request;

    if (requestRef.current === request) {
      requestRef.current = null;
    }
    if (controllerRef.current === controller) {
      controllerRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => load(true), [load]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      await load(false);
      if (!stopped && AppState.currentState === "active") {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    void poll();

    return () => {
      stopped = true;
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      controllerRef.current?.abort();
    };
  }, [isActive, load]);

  return { data, loading, refreshing, error, lastUpdated, refresh };
}
