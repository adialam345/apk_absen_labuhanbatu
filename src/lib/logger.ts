export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'API_REQUEST' | 'API_RESPONSE' | 'ERROR' | 'INFO' | 'SUPABASE';
  title: string;
  endpoint?: string;
  method?: string;
  payload?: any;
  response?: any;
  statusCode?: number;
  durationMs?: number;
  error?: string;
}

type LogListener = (logs: LogEntry[]) => void;

class DebugLogger {
  private logs: LogEntry[] = [];
  private listeners: LogListener[] = [];
  private maxLogs: number = 50;

  constructor() {
    this.addLog({
      type: 'INFO',
      title: 'Sistem Debug Dimulai',
      payload: { app: 'Absensi Labuhanbatu', version: '2.0.1' }
    });
  }

  public addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): LogEntry {
    const fullEntry: LogEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour12: false }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0')
    };

    this.logs.unshift(fullEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    this.notifyListeners();
    return fullEntry;
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.push(listener);
    listener(this.logs);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l(this.logs));
  }
}

export const logger = new DebugLogger();
