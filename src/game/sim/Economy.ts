import { BALANCE } from '../config/balance';
import { EventBus } from '../core/EventBus';
import { TransactionRecord } from '../core/Types';

export class EconomySystem {
  private moneyCents: number;
  private transactions: TransactionRecord[] = [];
  private static MAX_HISTORY = 25;

  constructor(
    initialCents: number = BALANCE.STARTING_MONEY_CENTS,
    initialHistory: TransactionRecord[] = [],
    private eventBus?: EventBus
  ) {
    this.moneyCents = Math.max(0, Math.floor(initialCents));
    this.transactions = [...initialHistory];
  }

  getMoneyCents(): number {
    return this.moneyCents;
  }

  getFormattedMoney(): string {
    return EconomySystem.formatCents(this.moneyCents);
  }

  static formatCents(cents: number): string {
    const dollars = cents / 100;
    return `$${dollars.toFixed(2)}`;
  }

  canAfford(amountCents: number): boolean {
    if (amountCents < 0 || !Number.isFinite(amountCents)) return false;
    return this.moneyCents >= Math.floor(amountCents);
  }

  earn(amountCents: number, reason: string): { success: boolean; newBalance: number } {
    const validAmount = Math.floor(amountCents);
    if (!Number.isFinite(validAmount) || validAmount <= 0) {
      return { success: false, newBalance: this.moneyCents };
    }

    this.moneyCents += validAmount;
    this.recordTransaction(validAmount, reason);
    this.eventBus?.emit('moneyChanged', {
      cents: this.moneyCents,
      delta: validAmount,
      reason,
    });
    return { success: true, newBalance: this.moneyCents };
  }

  spend(amountCents: number, reason: string): { success: boolean; newBalance: number } {
    const validAmount = Math.floor(amountCents);
    if (!Number.isFinite(validAmount) || validAmount <= 0) {
      return { success: false, newBalance: this.moneyCents };
    }

    if (this.moneyCents < validAmount) {
      return { success: false, newBalance: this.moneyCents };
    }

    this.moneyCents -= validAmount;
    this.recordTransaction(-validAmount, reason);
    this.eventBus?.emit('moneyChanged', {
      cents: this.moneyCents,
      delta: -validAmount,
      reason,
    });
    return { success: true, newBalance: this.moneyCents };
  }

  deductForce(amountCents: number, reason: string): number {
    // Used for penalties/collapse fees - takes up to cash available, never below 0
    const actualTaken = Math.min(this.moneyCents, Math.max(0, Math.floor(amountCents)));
    if (actualTaken > 0) {
      this.moneyCents -= actualTaken;
      this.recordTransaction(-actualTaken, reason);
      this.eventBus?.emit('moneyChanged', {
        cents: this.moneyCents,
        delta: -actualTaken,
        reason,
      });
    }
    return actualTaken;
  }

  getRecentTransactions(): TransactionRecord[] {
    return [...this.transactions];
  }

  private recordTransaction(amountCents: number, reason: string): void {
    const record: TransactionRecord = {
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      amountCents,
      reason,
      balanceAfterCents: this.moneyCents,
    };
    this.transactions.unshift(record);
    if (this.transactions.length > EconomySystem.MAX_HISTORY) {
      this.transactions.pop();
    }
  }
}
