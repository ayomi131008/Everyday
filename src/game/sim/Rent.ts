import { BALANCE } from '../config/balance';
import { EventBus } from '../core/EventBus';
import { RentState } from '../core/Types';
import { EconomySystem } from './Economy';

export class RentSystem {
  private rentState: RentState;
  private warnedForCycle: boolean = false;

  constructor(initialRent?: Partial<RentState>, private eventBus?: EventBus) {
    this.rentState = {
      dueDay: initialRent?.dueDay ?? BALANCE.RENT.CYCLE_DAYS,
      dueHour: initialRent?.dueHour ?? BALANCE.RENT.DUE_HOUR,
      amountCents: initialRent?.amountCents ?? BALANCE.RENT.AMOUNT_CENTS,
      isLate: initialRent?.isLate ?? false,
      lateFeeCents: initialRent?.lateFeeCents ?? 0,
      missedCount: initialRent?.missedCount ?? 0,
    };
  }

  getRentState(): RentState {
    return { ...this.rentState };
  }

  getTotalDueCents(): number {
    return this.rentState.amountCents + this.rentState.lateFeeCents;
  }

  getHoursUntilDue(currentDay: number, currentHour: number): number {
    const currentTotalHours = (currentDay - 1) * 24 + currentHour;
    const dueTotalHours = (this.rentState.dueDay - 1) * 24 + this.rentState.dueHour;
    return dueTotalHours - currentTotalHours;
  }

  checkDue(currentDay: number, currentHour: number, economy: EconomySystem): {
    dueNow: boolean;
    autoPaid?: boolean;
    wentLate?: boolean;
    warningIssued?: boolean;
    message?: string;
  } {
    const hoursRemaining = this.getHoursUntilDue(currentDay, currentHour);

    // Warning notification 12 hours before
    if (hoursRemaining <= BALANCE.RENT.WARNING_HOURS_BEFORE && hoursRemaining > 0 && !this.warnedForCycle) {
      this.warnedForCycle = true;
      this.eventBus?.emit('rentWarning', {
        hoursRemaining,
        amountCents: this.getTotalDueCents(),
      });
      return {
        dueNow: false,
        warningIssued: true,
        message: `Rent notice: ${EconomySystem.formatCents(this.getTotalDueCents())} due in ${Math.round(hoursRemaining)} hours!`,
      };
    }

    // Due time reached
    if (hoursRemaining <= 0) {
      const totalCost = this.getTotalDueCents();

      if (economy.canAfford(totalCost)) {
        // Auto-pay
        economy.spend(totalCost, 'Rent payment (Lindqvist Arms Apt 2B)');
        this.resetNextCycle(currentDay);
        this.eventBus?.emit('rentPaid', { amountCents: totalCost, auto: true });
        return {
          dueNow: true,
          autoPaid: true,
          message: `Rent of ${EconomySystem.formatCents(totalCost)} was auto-paid to Lindqvist Arms.`,
        };
      } else {
        // Missed rent
        if (!this.rentState.isLate) {
          this.rentState.isLate = true;
          this.rentState.lateFeeCents = BALANCE.RENT.LATE_FEE_CENTS;
          this.rentState.dueDay = currentDay + 1; // 1 day grace period
          this.rentState.missedCount += 1;
          this.warnedForCycle = false;
          this.eventBus?.emit('rentOverdue', {
            newTotalCents: this.getTotalDueCents(),
            lateFeeCents: this.rentState.lateFeeCents,
          });
          return {
            dueNow: true,
            wentLate: true,
            message: `Rent overdue! Lindqvist Arms applied a $10 late fee. 1 day grace period granted.`,
          };
        } else {
          // Repeated miss
          this.rentState.missedCount += 1;
          this.rentState.dueDay = currentDay + 1;
          this.warnedForCycle = false;
          return {
            dueNow: true,
            wentLate: true,
            message: `Second rent warning pinned to your door: "Please pay Lindqvist Management promptly!"`,
          };
        }
      }
    }

    return { dueNow: false };
  }

  payManually(economy: EconomySystem, currentDay: number): { success: boolean; message: string } {
    const totalDue = this.getTotalDueCents();
    if (!economy.canAfford(totalDue)) {
      return {
        success: false,
        message: `Insufficient funds. You need ${EconomySystem.formatCents(totalDue)} to pay rent.`,
      };
    }

    economy.spend(totalDue, 'Rent payment (Lindqvist Arms Apt 2B)');
    this.resetNextCycle(currentDay);
    this.eventBus?.emit('rentPaid', { amountCents: totalDue, auto: false });
    return {
      success: true,
      message: `Rent of ${EconomySystem.formatCents(totalDue)} successfully paid! Your lease is safe for 3 days.`,
    };
  }

  private resetNextCycle(currentDay: number): void {
    this.rentState.isLate = false;
    this.rentState.lateFeeCents = 0;
    this.rentState.dueDay = currentDay + BALANCE.RENT.CYCLE_DAYS;
    this.rentState.dueHour = BALANCE.RENT.DUE_HOUR;
    this.warnedForCycle = false;
  }
}
