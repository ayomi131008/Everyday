import { BALANCE } from '../config/balance';
import { ITEMS } from '../config/items';
import { GameSettings, SaveData } from '../core/Types';

export class SaveManager {
  private static readonly SAVE_KEY = 'everyday_save_v1';
  private static readonly BACKUP_KEY = 'everyday_save_backup_v1';
  private static readonly CURRENT_VERSION = 1;

  public static readonly DEFAULT_SETTINGS: GameSettings = {
    masterVolume: 0.8,
    musicVolume: 0.5,
    sfxVolume: 0.85,
    ambienceVolume: 0.6,
    mouseSensitivity: 1.0,
    invertY: false,
    graphicsQuality: 'medium',
    showFps: false,
  };

  static createDefaultSaveData(): SaveData {
    return {
      version: this.CURRENT_VERSION,
      savedAt: Date.now(),
      checksum: '',
      moneyCents: BALANCE.STARTING_MONEY_CENTS,
      needs: { ...BALANCE.STARTING_NEEDS },
      time: {
        day: 1,
        hour: 8,
        minute: 0,
      },
      player: {
        position: { x: 0, y: 0.9, z: -10 },
        rotationY: 0,
        currentZone: 'exterior',
      },
      inventory: [
        { id: 'snack_candy', quantity: 1 },
        { id: 'water_bottle', quantity: 1 },
      ],
      job: {
        jobId: 'mels_diner',
        hired: false,
        shiftsCompleted: 0,
        promotionTier: 0,
      },
      rent: {
        dueDay: 3,
        dueHour: 18,
        amountCents: BALANCE.RENT.AMOUNT_CENTS,
        isLate: false,
        lateFeeCents: 0,
        missedCount: 0,
      },
      objectives: {
        currentId: 'explore_controls',
        completedIds: [],
        dailyGoals: [],
      },
      settings: { ...this.DEFAULT_SETTINGS },
      lifestyleTier: 0,
      recentTransactions: [
        {
          id: 'tx_init',
          timestamp: Date.now(),
          amountCents: BALANCE.STARTING_MONEY_CENTS,
          reason: 'Initial savings (Brightwater arrival duffel bag)',
          balanceAfterCents: BALANCE.STARTING_MONEY_CENTS,
        },
      ],
    };
  }

  static save(data: SaveData): { success: boolean; message?: string } {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { success: false, message: 'LocalStorage unavailable in this environment' };
      }

      data.savedAt = Date.now();
      data.version = this.CURRENT_VERSION;
      data.checksum = this.generateChecksum(data);

      const serialized = JSON.stringify(data);

      // Write to temp slot first
      const tempKey = `${this.SAVE_KEY}_temp`;
      window.localStorage.setItem(tempKey, serialized);

      // Verify temp slot by re-reading and parsing
      const testRead = window.localStorage.getItem(tempKey);
      if (!testRead) throw new Error('Temp slot verification failed');
      const parsed = JSON.parse(testRead);
      if (!this.validateSaveData(parsed)) {
        throw new Error('Save data failed validation check');
      }

      // Promote existing primary save to backup if exists
      const existing = window.localStorage.getItem(this.SAVE_KEY);
      if (existing) {
        window.localStorage.setItem(this.BACKUP_KEY, existing);
      }

      // Commit primary
      window.localStorage.setItem(this.SAVE_KEY, serialized);
      window.localStorage.removeItem(tempKey);

      return { success: true };
    } catch (err: any) {
      console.warn('SaveManager failed to save game:', err);
      return { success: false, message: err?.message || 'Storage error' };
    }
  }

  static hasSave(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      return (
        window.localStorage.getItem(this.SAVE_KEY) !== null ||
        window.localStorage.getItem(this.BACKUP_KEY) !== null
      );
    } catch {
      return false;
    }
  }

  static load(): { data: SaveData; fromBackup: boolean; success: boolean } {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { data: this.createDefaultSaveData(), fromBackup: false, success: false };
      }

      const primary = window.localStorage.getItem(this.SAVE_KEY);
      if (primary) {
        try {
          const parsed = JSON.parse(primary);
          if (this.validateSaveData(parsed)) {
            const sanitized = this.sanitizeAndMigrate(parsed);
            return { data: sanitized, fromBackup: false, success: true };
          }
        } catch (e) {
          console.warn('Corrupted primary save file, attempting backup load:', e);
        }
      }

      // Try backup slot
      const backup = window.localStorage.getItem(this.BACKUP_KEY);
      if (backup) {
        try {
          const parsedBackup = JSON.parse(backup);
          if (this.validateSaveData(parsedBackup)) {
            const sanitized = this.sanitizeAndMigrate(parsedBackup);
            return { data: sanitized, fromBackup: true, success: true };
          }
        } catch (e) {
          console.error('Backup save also corrupted:', e);
        }
      }

      // Fallback default
      return { data: this.createDefaultSaveData(), fromBackup: false, success: false };
    } catch {
      return { data: this.createDefaultSaveData(), fromBackup: false, success: false };
    }
  }

  static deleteSave(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.SAVE_KEY);
        window.localStorage.removeItem(this.BACKUP_KEY);
      }
    } catch (err) {
      console.warn('Could not delete save:', err);
    }
  }

  private static generateChecksum(data: SaveData): string {
    const raw = `${data.version}_${data.moneyCents}_${data.time.day}_${data.time.hour}_${data.time.minute}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  }

  static validateSaveData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.version !== 'number') return false;
    if (typeof data.moneyCents !== 'number' || !Number.isFinite(data.moneyCents) || data.moneyCents < 0) return false;
    if (!data.needs || typeof data.needs !== 'object') return false;
    if (!data.time || typeof data.time.day !== 'number') return false;
    if (!data.player || typeof data.player !== 'object') return false;
    return true;
  }

  static sanitizeAndMigrate(raw: any): SaveData {
    const defaults = this.createDefaultSaveData();

    // Sanitize numbers and ranges
    const moneyCents = Math.max(0, Math.floor(raw.moneyCents ?? defaults.moneyCents));

    const needs = {
      hunger: Math.max(0, Math.min(100, raw.needs?.hunger ?? defaults.needs.hunger)),
      energy: Math.max(0, Math.min(100, raw.needs?.energy ?? defaults.needs.energy)),
      hygiene: Math.max(0, Math.min(100, raw.needs?.hygiene ?? defaults.needs.hygiene)),
      fun: Math.max(0, Math.min(100, raw.needs?.fun ?? defaults.needs.fun)),
    };

    const time = {
      day: Math.max(1, Math.floor(raw.time?.day ?? 1)),
      hour: Math.max(0, Math.min(23, Math.floor(raw.time?.hour ?? 8))),
      minute: Math.max(0, Math.min(59, Math.floor(raw.time?.minute ?? 0))),
    };

    const playerPos = {
      x: Number.isFinite(raw.player?.position?.x) ? raw.player.position.x : defaults.player.position.x,
      y: Number.isFinite(raw.player?.position?.y) ? raw.player.position.y : defaults.player.position.y,
      z: Number.isFinite(raw.player?.position?.z) ? raw.player.position.z : defaults.player.position.z,
    };

    const validZones = ['exterior', 'apartment', 'diner', 'convenience'];
    const currentZone = validZones.includes(raw.player?.currentZone) ? raw.player.currentZone : 'exterior';

    // Sanitize inventory
    const inventory: { id: string; quantity: number }[] = [];
    if (Array.isArray(raw.inventory)) {
      for (const item of raw.inventory) {
        if (item && ITEMS[item.id] && typeof item.quantity === 'number' && item.quantity > 0) {
          inventory.push({ id: item.id, quantity: Math.floor(item.quantity) });
        }
      }
    }

    return {
      version: this.CURRENT_VERSION,
      savedAt: raw.savedAt || Date.now(),
      checksum: raw.checksum || '',
      moneyCents,
      needs,
      time,
      player: {
        position: playerPos,
        rotationY: Number.isFinite(raw.player?.rotationY) ? raw.player.rotationY : 0,
        currentZone,
      },
      inventory: inventory.length > 0 ? inventory : defaults.inventory,
      job: {
        jobId: raw.job?.jobId || defaults.job.jobId,
        hired: !!raw.job?.hired,
        shiftsCompleted: Math.max(0, Math.floor(raw.job?.shiftsCompleted || 0)),
        promotionTier: Math.max(0, Math.floor(raw.job?.promotionTier || 0)),
      },
      rent: {
        dueDay: Math.max(1, Math.floor(raw.rent?.dueDay || defaults.rent.dueDay)),
        dueHour: Math.max(0, Math.min(23, Math.floor(raw.rent?.dueHour ?? defaults.rent.dueHour))),
        amountCents: Math.max(0, Math.floor(raw.rent?.amountCents || defaults.rent.amountCents)),
        isLate: !!raw.rent?.isLate,
        lateFeeCents: Math.max(0, Math.floor(raw.rent?.lateFeeCents || 0)),
        missedCount: Math.max(0, Math.floor(raw.rent?.missedCount || 0)),
      },
      objectives: {
        currentId: raw.objectives?.currentId || defaults.objectives.currentId,
        completedIds: Array.isArray(raw.objectives?.completedIds) ? raw.objectives.completedIds : [],
        dailyGoals: Array.isArray(raw.objectives?.dailyGoals) ? raw.objectives.dailyGoals : [],
      },
      settings: {
        ...this.DEFAULT_SETTINGS,
        ...(raw.settings || {}),
      },
      lifestyleTier: Math.max(0, Math.floor(raw.lifestyleTier || 0)),
      recentTransactions: Array.isArray(raw.recentTransactions)
        ? raw.recentTransactions.slice(0, 25)
        : defaults.recentTransactions,
    };
  }
}
