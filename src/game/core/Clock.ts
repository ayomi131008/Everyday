import { EventBus } from './EventBus';

export interface GameTime {
  day: number;
  hour: number;
  minute: number;
  totalMinutes: number;
}

export class Clock {
  // 1 real second = 2 in-game minutes
  // In milliseconds: 1 real second (1000ms) = 120 in-game seconds = 2 in-game minutes
  // rate: 2 in-game minutes / real second = 2 / 1000 minutes per ms = 1/500 minutes per ms
  private timeRatio: number = 2 / 1000; // minutes per real ms
  private totalMinutes: number = 8 * 60; // Start at Day 1, 08:00 AM
  private paused: boolean = false;
  private lastHourEmitted: number = 8;

  constructor(private eventBus?: EventBus) {}

  setTime(day: number, hour: number, minute: number): void {
    const total = (day - 1) * 24 * 60 + hour * 60 + minute;
    this.totalMinutes = Math.max(0, total);
    this.lastHourEmitted = hour;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  isPaused(): boolean {
    return this.paused;
  }

  advanceMinutes(minutes: number): void {
    if (minutes <= 0) return;
    const oldHour = this.getTime().hour;
    this.totalMinutes += minutes;
    const newTime = this.getTime();
    if (newTime.hour !== oldHour && this.eventBus) {
      this.eventBus.emit('hourPassed', newTime);
    }
  }

  update(deltaMs: number): void {
    if (this.paused || deltaMs <= 0) return;
    const inGameMinutesPassed = deltaMs * this.timeRatio;
    const prevHour = Math.floor((this.totalMinutes / 60) % 24);
    this.totalMinutes += inGameMinutesPassed;
    const currentHour = Math.floor((this.totalMinutes / 60) % 24);

    if (currentHour !== prevHour) {
      this.lastHourEmitted = currentHour;
      this.eventBus?.emit('hourPassed', this.getTime());
    }
  }

  getTime(): GameTime {
    const totalMins = Math.floor(this.totalMinutes);
    const day = Math.floor(totalMins / (24 * 60)) + 1;
    const minutesInDay = totalMins % (24 * 60);
    const hour = Math.floor(minutesInDay / 60);
    const minute = minutesInDay % 60;
    return {
      day,
      hour,
      minute,
      totalMinutes: totalMins,
    };
  }

  getNormalizedDayTime(): number {
    // 0.0 at midnight (00:00), 0.5 at noon (12:00), 1.0 at next midnight
    const minutesInDay = this.totalMinutes % (24 * 60);
    return minutesInDay / (24 * 60);
  }

  getFormattedTime(): { timeString: string; dayString: string; period: string } {
    const { day, hour, minute } = this.getTime();
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMin = minute.toString().padStart(2, '0');
    return {
      timeString: `${displayHour}:${displayMin}`,
      dayString: `Day ${day}`,
      period,
    };
  }
}
