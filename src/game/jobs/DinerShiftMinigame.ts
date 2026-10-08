import { OrderRecipe } from '../config/jobs';

export interface MinigameOrderState {
  recipe: OrderRecipe;
  currentStepIndex: number;
  timeRemainingSec: number;
  totalTimeSec: number;
  completed: boolean;
  failed: boolean;
  earnedTipCents: number;
}

export class DinerShiftMinigame {
  public orders: OrderRecipe[] = [];
  public currentOrderIndex: number = 0;
  public currentOrder: MinigameOrderState | null = null;
  public totalTipsCents: number = 0;
  public ordersCompletedCount: number = 0;
  public isFinished: boolean = false;

  // Set of all unique ingredients across recipes to show as buttons
  public availableIngredients: string[] = [
    'Bottom Bun',
    'Grilled Patty',
    'Cheddar Cheese',
    'Crisp Lettuce',
    'Top Bun',
    'Crinkle Fries',
    'Golden Flapjack',
    'Butter Pat',
    'Maple Syrup',
    'Fried Egg',
    'Crispy Bacon',
    'Toast Slice',
    'Black Coffee',
    'Vanilla Shake',
  ];

  constructor(recipePool: OrderRecipe[], orderCount: number = 5) {
    // Generate order queue
    for (let i = 0; i < orderCount; i++) {
      const recipe = recipePool[i % recipePool.length];
      this.orders.push(recipe);
    }
    this.startOrder(0);
  }

  private startOrder(index: number): void {
    if (index >= this.orders.length) {
      this.isFinished = true;
      this.currentOrder = null;
      return;
    }

    this.currentOrderIndex = index;
    const recipe = this.orders[index];
    this.currentOrder = {
      recipe,
      currentStepIndex: 0,
      timeRemainingSec: recipe.timeLimitSec,
      totalTimeSec: recipe.timeLimitSec,
      completed: false,
      failed: false,
      earnedTipCents: 0,
    };
  }

  update(deltaSec: number): void {
    if (this.isFinished || !this.currentOrder) return;

    this.currentOrder.timeRemainingSec -= deltaSec;
    if (this.currentOrder.timeRemainingSec <= 0) {
      // Order timed out
      this.currentOrder.failed = true;
      this.currentOrder.timeRemainingSec = 0;
      // Advance to next order
      setTimeout(() => {
        this.startOrder(this.currentOrderIndex + 1);
      }, 700);
    }
  }

  submitIngredient(ingredient: string): {
    correct: boolean;
    orderFinished: boolean;
    earnedTipCents: number;
    expectedStep: string;
  } {
    if (!this.currentOrder || this.currentOrder.completed || this.currentOrder.failed) {
      return { correct: false, orderFinished: false, earnedTipCents: 0, expectedStep: '' };
    }

    const expected = this.currentOrder.recipe.steps[this.currentOrder.currentStepIndex];

    if (ingredient === expected) {
      this.currentOrder.currentStepIndex += 1;

      // Check if order finished
      if (this.currentOrder.currentStepIndex >= this.currentOrder.recipe.steps.length) {
        this.currentOrder.completed = true;
        this.ordersCompletedCount += 1;

        // Calculate speed tip: 60% to 100% of base tip
        const speedRatio = Math.max(0.4, this.currentOrder.timeRemainingSec / this.currentOrder.totalTimeSec);
        const tip = Math.round(this.currentOrder.recipe.baseTipCents * speedRatio);
        this.currentOrder.earnedTipCents = tip;
        this.totalTipsCents += tip;

        // Advance to next after brief pause
        setTimeout(() => {
          this.startOrder(this.currentOrderIndex + 1);
        }, 600);

        return { correct: true, orderFinished: true, earnedTipCents: tip, expectedStep: expected };
      }

      return { correct: true, orderFinished: false, earnedTipCents: 0, expectedStep: expected };
    } else {
      // Mistake: lose 2 seconds on the ticket timer
      this.currentOrder.timeRemainingSec = Math.max(0, this.currentOrder.timeRemainingSec - 2.0);
      return { correct: false, orderFinished: false, earnedTipCents: 0, expectedStep: expected };
    }
  }
}
