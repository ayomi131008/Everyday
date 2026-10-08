import { JOBS, JobDef, OrderRecipe } from '../config/jobs';
import { EventBus } from '../core/EventBus';
import { JobProgress } from '../core/Types';
import { EconomySystem } from '../sim/Economy';

export interface ShiftSummary {
  jobId: string;
  jobName: string;
  hoursWorked: number;
  ordersCompleted: number;
  totalOrders: number;
  accuracyPercent: number;
  basePayCents: number;
  tipsCents: number;
  totalPayCents: number;
  newShiftCount: number;
  promotedNow: boolean;
}

export class JobSystem {
  private progress: JobProgress;

  constructor(initialProgress?: Partial<JobProgress>, private eventBus?: EventBus) {
    this.progress = {
      jobId: initialProgress?.jobId || 'mels_diner',
      hired: !!initialProgress?.hired,
      shiftsCompleted: initialProgress?.shiftsCompleted || 0,
      promotionTier: initialProgress?.promotionTier || 0,
    };
  }

  getProgress(): JobProgress {
    return { ...this.progress };
  }

  isHired(): boolean {
    return this.progress.hired;
  }

  hire(): void {
    this.progress.hired = true;
    this.eventBus?.emit('jobHired', { jobId: this.progress.jobId });
  }

  getJobDef(): JobDef {
    return JOBS[this.progress.jobId] || JOBS.mels_diner;
  }

  getHourlyRateCents(): number {
    const def = this.getJobDef();
    if (this.progress.promotionTier > 0 || this.progress.shiftsCompleted >= def.promotedAfterShifts) {
      return def.promotedHourlyRateCents;
    }
    return def.baseHourlyRateCents;
  }

  calculateShiftPayout(
    ordersCompleted: number,
    totalOrders: number,
    rawTipsCents: number,
    hygiene: number,
    fun: number
  ): ShiftSummary {
    const def = this.getJobDef();
    const hours = def.shiftDurationHours;
    const hourlyRate = this.getHourlyRateCents();
    const basePayCents = Math.round(hourlyRate * hours);

    // Tips modifier from hygiene and fun
    let tipMultiplier = 1.0;
    if (hygiene < 35) tipMultiplier *= 0.7; // customers smell you
    if (fun < 30) tipMultiplier *= 0.85;    // gloomy attitude

    const tipsCents = Math.round(rawTipsCents * tipMultiplier);
    const totalPayCents = basePayCents + tipsCents;

    const accuracyPercent = totalOrders > 0 ? Math.round((ordersCompleted / totalOrders) * 100) : 0;
    const prevShifts = this.progress.shiftsCompleted;
    this.progress.shiftsCompleted += 1;

    let promotedNow = false;
    if (this.progress.promotionTier === 0 && this.progress.shiftsCompleted >= def.promotedAfterShifts) {
      this.progress.promotionTier = 1;
      promotedNow = true;
    }

    const summary: ShiftSummary = {
      jobId: def.id,
      jobName: def.name,
      hoursWorked: hours,
      ordersCompleted,
      totalOrders,
      accuracyPercent,
      basePayCents,
      tipsCents,
      totalPayCents,
      newShiftCount: this.progress.shiftsCompleted,
      promotedNow,
    };

    this.eventBus?.emit('shiftCompleted', summary);
    return summary;
  }
}
