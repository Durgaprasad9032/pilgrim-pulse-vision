import { PredictionResponse } from "./predictionApi";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

type MessageHandler = (data: PredictionResponse) => void;
type StatusHandler = (status: ConnectionStatus) => void;
type ErrorHandler = (error: string) => void;

/**
 * Exponential backoff delays in milliseconds as specified in Phase 6.2B:
 * Attempt 1: 3,000ms (3s)
 * Attempt 2: 6,000ms (6s)
 * Attempt 3: 12,000ms (12s)
 * Max Cap: 30,000ms (30s)
 */
const BACKOFF_SCHEDULE_MS = [3000, 6000, 12000];
const MAX_BACKOFF_MS = 30000;

function getBackoffDelay(attemptCount: number): number {
  if (attemptCount <= 0) return BACKOFF_SCHEDULE_MS[0];
  const index = attemptCount - 1;
  if (index < BACKOFF_SCHEDULE_MS.length) {
    return BACKOFF_SCHEDULE_MS[index];
  }
  return MAX_BACKOFF_MS;
}

function resolveWsUrl(): string {
  const envUrl = import.meta.env.VITE_WS_BASE_URL;
  if (envUrl) {
    return envUrl.endsWith("/ws/predictions") ? envUrl : `${envUrl}/ws/predictions`;
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    const wsHost = apiBase.replace(/^http(s)?:\/\//, "");
    const protocol = apiBase.startsWith("https") ? "wss:" : "ws:";
    return `${protocol}//${wsHost}/ws/predictions`;
  }
  return "ws://localhost:8000/ws/predictions";
}

/**
 * Singleton service for managing single persistent WebSocket connection to FastAPI backend.
 * Provides listener subscriptions, safe parsing, automatic exponential backoff reconnects,
 * and clean unmount cleanup.
 */
class PredictionSocketService {
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = "disconnected";
  private reconnectAttempt = 0;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private explicitDisconnect = false;

  private messageSubscribers: Set<MessageHandler> = new Set();
  private statusSubscribers: Set<StatusHandler> = new Set();
  private errorSubscribers: Set<ErrorHandler> = new Set();

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === "connected";
  }

  public connect(): void {
    this.explicitDisconnect = false;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.clearTimers();
    this.updateStatus(this.reconnectAttempt > 0 ? "reconnecting" : "connecting");

    const url = resolveWsUrl();
    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.reconnectAttempt = 0;
        this.updateStatus("connected");
        this.startHeartbeat();
      };

      this.socket.onmessage = (event: MessageEvent) => {
        this.handleIncomingMessage(event);
      };

      this.socket.onerror = (err: Event) => {
        const errorMsg = "WebSocket connection error occurred.";
        this.notifyError(errorMsg);
      };

      this.socket.onclose = (event: CloseEvent) => {
        this.stopHeartbeat();
        this.socket = null;

        if (!this.explicitDisconnect) {
          this.scheduleReconnect();
        } else {
          this.updateStatus("disconnected");
        }
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to initialize WebSocket";
      this.notifyError(errorMsg);
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.explicitDisconnect = true;
    this.clearTimers();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.updateStatus("disconnected");
  }

  public subscribeMessage(handler: MessageHandler): () => void {
    this.messageSubscribers.add(handler);
    return () => {
      this.messageSubscribers.delete(handler);
    };
  }

  public subscribeStatus(handler: StatusHandler): () => void {
    this.statusSubscribers.add(handler);
    handler(this.status);
    return () => {
      this.statusSubscribers.delete(handler);
    };
  }

  public subscribeError(handler: ErrorHandler): () => void {
    this.errorSubscribers.add(handler);
    return () => {
      this.errorSubscribers.delete(handler);
    };
  }

  private handleIncomingMessage(event: MessageEvent): void {
    try {
      if (typeof event.data === "string") {
        if (event.data === "pong") return;
        const payload: PredictionResponse = JSON.parse(event.data);
        if (payload && Array.isArray(payload.zones)) {
          this.messageSubscribers.forEach((fn) => fn(payload));
        }
      }
    } catch (err) {
      console.error("[PredictionSocket] Failed to parse payload:", err);
    }
  }

  private scheduleReconnect(): void {
    if (this.explicitDisconnect) return;

    this.reconnectAttempt += 1;
    const delay = getBackoffDelay(this.reconnectAttempt);
    this.updateStatus("reconnecting");

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send("ping");
        } catch {
          // Socket write error will trigger onclose
        }
      }
    }, 20000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearTimers(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
  }

  private updateStatus(newStatus: ConnectionStatus): void {
    this.status = newStatus;
    this.statusSubscribers.forEach((fn) => fn(newStatus));
  }

  private notifyError(msg: string): void {
    this.errorSubscribers.forEach((fn) => fn(msg));
  }
}

export const predictionSocketService = new PredictionSocketService();
