export type GameStatePhase = 'loading' | 'title' | 'playing' | 'paused' | 'minigame';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface NeedsState {
  hunger: number;  // 0 - 100
  energy: number;  // 0 - 100
  hygiene: number; // 0 - 100
  fun: number;     // 0 - 100
}

export interface InventoryItem {
  id: string;
  quantity: number;
}

export interface JobProgress {
  jobId: string;
  hired: boolean;
  shiftsCompleted: number;
  promotionTier: number; // 0 = base, 1 = senior
}

export interface RentState {
  dueDay: number;
  dueHour: number;
  amountCents: number;
  isLate: boolean;
  lateFeeCents: number;
  missedCount: number;
}

export interface TransactionRecord {
  id: string;
  timestamp: number;
  amountCents: number; // positive = earn, negative = spend
  reason: string;
  balanceAfterCents: number;
}

export interface GameSettings {
  masterVolume: number; // 0 - 1
  musicVolume: number;  // 0 - 1
  sfxVolume: number;    // 0 - 1
  ambienceVolume: number; // 0 - 1
  mouseSensitivity: number; // 0.2 - 2.0
  invertY: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
  showFps: boolean;
}

export interface ObjectiveState {
  currentId: string;
  completedIds: string[];
  dailyGoals: {
    id: string;
    text: string;
    target: number;
    current: number;
    rewardCents: number;
    completed: boolean;
    claimed: boolean;
  }[];
}

export interface SaveData {
  version: number;
  savedAt: number;
  checksum: string;
  moneyCents: number;
  needs: NeedsState;
  time: {
    day: number;
    hour: number;
    minute: number;
  };
  player: {
    position: Vector3D;
    rotationY: number;
    currentZone: 'exterior' | 'apartment' | 'diner' | 'convenience';
  };
  inventory: InventoryItem[];
  job: JobProgress;
  rent: RentState;
  objectives: ObjectiveState;
  settings: GameSettings;
  lifestyleTier: number;
  recentTransactions: TransactionRecord[];
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'alert';
  durationMs?: number;
}

export interface InteractionPrompt {
  id: string;
  label: string;
  verb: string;
  distance: number;
  disabledReason?: string;
}
