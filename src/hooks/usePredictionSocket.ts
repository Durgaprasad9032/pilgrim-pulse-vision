import { useState, useEffect, useCallback } from "react";
import { fetchPredictions, PredictionResponse } from "@/services/predictionApi";
import {
  predictionSocketService,
  ConnectionStatus,
} from "@/services/predictionSocket";

export interface UsePredictionSocketResult {
  prediction: PredictionResponse | null;
  data: PredictionResponse | null; // Alias for backward compatibility
  connected: boolean;
  status: ConnectionStatus;
  lastUpdated: Date | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Custom React hook for live AI crowd prediction streaming over WebSocket.
 * Manages WebSocket lifecycle, connection status, exponential backoff, and
 * seamless REST API fallback when WebSocket is offline or reconnecting.
 */
export function usePredictionSocket(): UsePredictionSocketResult {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>(
    predictionSocketService.getStatus()
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // REST Fallback fetcher
  const loadRestFallback = useCallback(async () => {
    try {
      const restData = await fetchPredictions();
      setPrediction((prev) => prev ?? restData);
      setLastUpdated((prev) => prev ?? new Date());
      setError(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unable to reach prediction service.";
      setError((prevError) => prevError || msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Connect to WebSocket
    predictionSocketService.connect();

    // 2. Subscribe to incoming messages
    const unsubscribeMessage = predictionSocketService.subscribeMessage(
      (data: PredictionResponse) => {
        setPrediction(data);
        setLastUpdated(new Date());
        setLoading(false);
        setError(null);
      }
    );

    // 3. Subscribe to connection status changes
    const unsubscribeStatus = predictionSocketService.subscribeStatus(
      (newStatus: ConnectionStatus) => {
        setStatus(newStatus);
        if (newStatus === "connected") {
          setError(null);
        }
      }
    );

    // 4. Subscribe to socket error notifications
    const unsubscribeError = predictionSocketService.subscribeError(
      (errorMsg: string) => {
        // Only set UI error if we don't have prediction data yet
        if (!predictionSocketService.isConnected()) {
          console.warn("[usePredictionSocket] Socket warning:", errorMsg);
        }
      }
    );

    // 5. Initial REST fallback if WebSocket connection is still pending or offline
    const fallbackTimer = window.setTimeout(() => {
      if (!predictionSocketService.isConnected()) {
        loadRestFallback();
      }
    }, 1200);

    return () => {
      window.clearTimeout(fallbackTimer);
      unsubscribeMessage();
      unsubscribeStatus();
      unsubscribeError();
    };
  }, [loadRestFallback]);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (!predictionSocketService.isConnected()) {
      predictionSocketService.connect();
      await loadRestFallback();
    } else {
      setLoading(false);
    }
  }, [loadRestFallback]);

  return {
    prediction,
    data: prediction,
    connected: status === "connected",
    status,
    lastUpdated,
    error,
    loading,
    refetch,
  };
}
