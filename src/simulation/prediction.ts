import type {
  CrowdMetrics,
  CrowdPrediction,
  PredictionConfidence,
  QueueState,
} from "./types";

/** Input contract — replaceable by FastAPI ML service later */
export interface PredictionInput {
  tick: number;
  currentCrowd: number;
  arrivalRate: number;
  exitRate: number;
  queueGrowth: number;
  congestionIndex: number;
  congestionTrend: number;
  queueState: QueueState;
  historyLength: number;
}

export interface PredictionResult {
  predictions: CrowdPrediction[];
  overallConfidence: PredictionConfidence;
  metrics: CrowdMetrics;
}

/** Pluggable predictor interface for future FastAPI backend */
export interface CrowdPredictor {
  predict(input: PredictionInput): PredictionResult;
  updateHistory(sample: {
    tick: number;
    crowd: number;
    congestion: number;
    queueTotal: number;
  }): void;
  reset(): void;
}

const HORIZONS = [5, 10, 30] as const;

function confidenceFromStability(
  historyLength: number,
  congestionTrend: number,
): PredictionConfidence {
  const absTrend = Math.abs(congestionTrend);
  if (historyLength >= 20 && absTrend < 2) return "High";
  if (historyLength >= 8 && absTrend < 5) return "Medium";
  return "Low";
}

function forecastCrowd(
  current: number,
  netFlowPerMin: number,
  queueGrowth: number,
  horizonMin: number,
  congestionTrend: number,
): number {
  const trendBoost = 1 + (congestionTrend / 100) * 0.15;
  const projected =
    current + netFlowPerMin * horizonMin * trendBoost + queueGrowth * horizonMin * 0.4;
  return Math.max(0, Math.round(projected));
}

function forecastCongestion(
  currentCongestion: number,
  netFlowPerMin: number,
  horizonMin: number,
  congestionTrend: number,
): number {
  const delta = (netFlowPerMin / 50) * horizonMin + congestionTrend * (horizonMin / 10);
  return Math.round(Math.min(100, Math.max(0, currentCongestion + delta)));
}

export class HeuristicCrowdPredictor implements CrowdPredictor {
  private history: { tick: number; crowd: number; congestion: number; queueTotal: number }[] =
    [];

  reset(): void {
    this.history = [];
  }

  updateHistory(sample: {
    tick: number;
    crowd: number;
    congestion: number;
    queueTotal: number;
  }): void {
    this.history.push(sample);
    if (this.history.length > 60) this.history.shift();
  }

  predict(input: PredictionInput): PredictionResult {
    const netFlowPerMin = (input.arrivalRate - input.exitRate) * 60;
    const overallConfidence = confidenceFromStability(
      input.historyLength,
      input.congestionTrend,
    );

    const predictions: CrowdPrediction[] = HORIZONS.map((horizonMinutes) => ({
      horizonMinutes,
      expectedCrowd: forecastCrowd(
        input.currentCrowd,
        netFlowPerMin,
        input.queueGrowth,
        horizonMinutes,
        input.congestionTrend,
      ),
      expectedCongestion: forecastCongestion(
        input.congestionIndex,
        netFlowPerMin,
        horizonMinutes,
        input.congestionTrend,
      ),
      confidence: overallConfidence,
    }));

    return {
      predictions,
      overallConfidence,
      metrics: {
        currentCrowd: input.currentCrowd,
        arrivalRate: input.arrivalRate,
        exitRate: input.exitRate,
        queueGrowth: input.queueGrowth,
        congestionTrend: input.congestionTrend,
      },
    };
  }

  computeCongestionTrend(): number {
    if (this.history.length < 3) return 0;
    const recent = this.history.slice(-5);
    const first = recent[0].congestion;
    const last = recent[recent.length - 1].congestion;
    const dt = Math.max(1, recent[recent.length - 1].tick - recent[0].tick);
    return ((last - first) / dt) * 10;
  }

  computeQueueGrowth(currentQueueTotal: number): number {
    if (this.history.length < 2) return 0;
    const prev = this.history[this.history.length - 2].queueTotal;
    return currentQueueTotal - prev;
  }
}

export const crowdPredictor = new HeuristicCrowdPredictor();
