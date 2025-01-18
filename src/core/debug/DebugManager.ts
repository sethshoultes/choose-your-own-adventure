import { create } from 'zustand';

export type LogType = 'info' | 'error' | 'warning' | 'success';

export interface LogEntry {
  timestamp: string;
  type: LogType;
  message: string;
  data?: any;
}

interface DebugState {
  enabled: boolean;
  logs: LogEntry[];
  toggleDebug: () => void;
  log: (message: string, type?: LogType, data?: any) => void;
  clearLogs: () => void;
}

const store = create<DebugState>((set) => ({
  enabled: false,
  logs: [],
  toggleDebug: () => set((state) => ({ enabled: !state.enabled })),
  log: (message, type = 'info', data) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          timestamp: new Date().toISOString(),
          type,
          message,
          data,
        },
      ],
    })),
  clearLogs: () => set({ logs: [] }),
}));

// Create a singleton instance for non-React contexts
export const debugManager = {
  log: (message: string, type?: LogType, data?: any) => store.getState().log(message, type, data),
  clearLogs: () => store.getState().clearLogs(),
  toggleDebug: () => store.getState().toggleDebug(),
  getState: () => store.getState(),
};

export const useDebugStore = store;