import { PredictionResponse } from "@/services/predictionApi";
import { usePredictionSocket } from "./usePredictionSocket";

export interface UsePredictionsResult {
  data: PredictionResponse | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

/**
 * Custom React hook for live XGBoost crowd density predictions.
 * Polling has been removed in favor of real-time WebSocket updates via usePredictionSocket.
 */
export function usePredictions(): UsePredictionsResult {
  const { prediction, loading, error, lastUpdated, refetch } = usePredictionSocket();

  return {
    data: prediction,
    loading,
    error,
    lastUpdated,
    refetch,
  };
}
