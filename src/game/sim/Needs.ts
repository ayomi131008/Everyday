import { BALANCE } from '../config/balance';
import { EventBus } from '../core/EventBus';
import { NeedsState } from '../core/Types';

export class NeedsSystem {
  private needs: NeedsState;
  private criticalWarningsEmitted: Set<keyof NeedsState> = new Set();
  private activityCountsToday: Record<string, number> = {};

  constructor(initialNeeds?: Partial<NeedsState>, private eventBus?: EventBus) {
    this.needs = {
      hunger: initialNeeds?.hunger ?? BALANCE.STARTING_NEEDS.hunger,
      energy: initialNeeds?.energy ?? BALANCE.STARTING_NEEDS.energy,
      hygiene: initialNeeds?.hygiene ?? BALANCE.STARTING_NEEDS.hygiene,
      fun: initialNeeds?.fun ?? BALANCE.STARTING_NEEDS.fun,
    };
  }

  getNeeds(): NeedsState {
    return { ...this.needs };
  }

  setNeeds(newNeeds: Partial<NeedsState>): void {
    if (newNeeds.hunger !== undefined) this.needs.hunger = this.clamp(newNeeds.hunger);
    if (newNeeds.energy !== undefined) this.needs.energy = this.clamp(newNeeds.energy);
    if (newNeeds.hygiene !== undefined) this.needs.hygiene = this.clamp(newNeeds.hygiene);
    if (newNeeds.fun !== undefined) this.needs.fun = this.clamp(newNeeds.fun);
    this.checkCriticalStatus();
  }

  resetDailyActivities(): void {
    this.activityCountsToday = {};
  }

  decay(inGameHours: number, isSprinting: boolean = false, isSleeping: boolean = false): void {
    if (inGameHours <= 0) return;

    if (isSleeping) {
      // Sleep restores energy and slows other decay
      this.needs.energy = this.clamp(
        this.needs.energy + BALANCE.SLEEP.ENERGY_RECOVERY_PER_HOUR * inGameHours
      );
      const decayMult = BALANCE.SLEEP.DECAY_MULTIPLIER_DURING_SLEEP;
      this.needs.hunger = this.clamp(
        this.needs.hunger - BALANCE.HOURLY_DECAY.hunger * inGameHours * decayMult
      );
      this.needs.hygiene = this.clamp(
        this.needs.hygiene - BALANCE.HOURLY_DECAY.hygiene * inGameHours * decayMult
      );
      this.needs.fun = this.clamp(
        this.needs.fun - BALANCE.HOURLY_DECAY.fun * inGameHours * decayMult
      );
    } else {
      let energyDecay = BALANCE.HOURLY_DECAY.energy * inGameHours;
      if (isSprinting) {
        energyDecay += BALANCE.SPRINT_EXTRA_ENERGY_DECAY_HOURLY * inGameHours;
      }

      this.needs.hunger = this.clamp(this.needs.hunger - BALANCE.HOURLY_DECAY.hunger * inGameHours);
      this.needs.energy = this.clamp(this.needs.energy - energyDecay);
      this.needs.hygiene = this.clamp(this.needs.hygiene - BALANCE.HOURLY_DECAY.hygiene * inGameHours);
      this.needs.fun = this.clamp(this.needs.fun - BALANCE.HOURLY_DECAY.fun * inGameHours);
    }

    this.checkCriticalStatus();
  }

  restore(delta: Partial<NeedsState>, activityId?: string): { gains: Partial<NeedsState>; message?: string } {
    let multiplier = 1.0;
    let message: string | undefined;

    if (activityId) {
      const times = this.activityCountsToday[activityId] || 0;
      if (times > 0) {
        multiplier = Math.max(0.3, 1.0 - times * 0.25);
        message = `You've done this already today. Diminished returns (-${Math.round((1 - multiplier) * 100)}%).`;
      }
      this.activityCountsToday[activityId] = times + 1;
    }

    const gains: Partial<NeedsState> = {};

    if (delta.hunger !== undefined) {
      const added = delta.hunger * multiplier;
      this.needs.hunger = this.clamp(this.needs.hunger + added);
      gains.hunger = added;
    }
    if (delta.energy !== undefined) {
      const added = delta.energy * multiplier;
      this.needs.energy = this.clamp(this.needs.energy + added);
      gains.energy = added;
    }
    if (delta.hygiene !== undefined) {
      const added = delta.hygiene * multiplier;
      this.needs.hygiene = this.clamp(this.needs.hygiene + added);
      gains.hygiene = added;
    }
    if (delta.fun !== undefined) {
      const added = delta.fun * multiplier;
      this.needs.fun = this.clamp(this.needs.fun + added);
      gains.fun = added;
    }

    this.checkCriticalStatus();
    this.eventBus?.emit('needsChanged', this.getNeeds());
    return { gains, message };
  }

  private checkCriticalStatus(): void {
    const keys: (keyof NeedsState)[] = ['hunger', 'energy', 'hygiene', 'fun'];
    for (const key of keys) {
      const val = this.needs[key];
      if (val <= BALANCE.CONSEQUENCES.LOW_NEED_THRESHOLD) {
        if (!this.criticalWarningsEmitted.has(key)) {
          this.criticalWarningsEmitted.add(key);
          this.eventBus?.emit('needCritical', { need: key, value: val });
        }
      } else {
        this.criticalWarningsEmitted.delete(key);
      }
    }

    if (this.needs.energy <= 0) {
      this.eventBus?.emit('playerCollapsed', { reason: 'exhaustion' });
    }
  }

  private clamp(val: number): number {
    if (Number.isNaN(val) || !Number.isFinite(val)) return 50;
    return Math.max(0, Math.min(100, Math.round(val * 10) / 10));
  }
}
