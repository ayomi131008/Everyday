import { DAILY_GOAL_TEMPLATES, ObjectiveDef, TUTORIAL_CHAIN } from '../config/objectives';
import { EventBus } from '../core/EventBus';
import { ObjectiveState, Vector3D } from '../core/Types';
import { EconomySystem } from '../sim/Economy';

export class ObjectiveSystem {
  private currentId: string;
  private completedIds: Set<string>;
  private dailyGoals: ObjectiveState['dailyGoals'] = [];

  constructor(initial?: Partial<ObjectiveState>, private eventBus?: EventBus) {
    this.currentId = initial?.currentId || TUTORIAL_CHAIN[0].id;
    this.completedIds = new Set(initial?.completedIds || []);
    if (initial?.dailyGoals && initial.dailyGoals.length > 0) {
      this.dailyGoals = [...initial.dailyGoals];
    } else {
      this.generateDailyGoals();
    }
  }

  getState(): ObjectiveState {
    return {
      currentId: this.currentId,
      completedIds: Array.from(this.completedIds),
      dailyGoals: [...this.dailyGoals],
    };
  }

  getCurrentObjective(): ObjectiveDef | undefined {
    return TUTORIAL_CHAIN.find((o) => o.id === this.currentId);
  }

  advance(completedId: string, economy?: EconomySystem): { advanced: boolean; rewardCents: number } {
    if (this.currentId !== completedId) {
      return { advanced: false, rewardCents: 0 };
    }

    const currentObj = this.getCurrentObjective();
    const reward = currentObj?.rewardCents || 0;

    this.completedIds.add(completedId);

    // Find next objective index
    const currentIndex = TUTORIAL_CHAIN.findIndex((o) => o.id === completedId);
    if (currentIndex >= 0 && currentIndex + 1 < TUTORIAL_CHAIN.length) {
      this.currentId = TUTORIAL_CHAIN[currentIndex + 1].id;
    }

    if (reward > 0 && economy) {
      economy.earn(reward, `Objective completed: ${currentObj?.title}`);
    }

    this.eventBus?.emit('objectiveAdvanced', {
      completedId,
      nextId: this.currentId,
      rewardCents: reward,
    });

    return { advanced: true, rewardCents: reward };
  }

  reportDailyProgress(goalId: string, amount: number = 1): void {
    const goal = this.dailyGoals.find((g) => g.id === goalId && !g.completed);
    if (goal) {
      goal.current += amount;
      if (goal.current >= goal.target) {
        goal.completed = true;
        this.eventBus?.emit('dailyGoalCompleted', goal);
      }
    }
  }

  claimDailyGoal(goalId: string, economy: EconomySystem): boolean {
    const goal = this.dailyGoals.find((g) => g.id === goalId && g.completed && !g.claimed);
    if (goal) {
      goal.claimed = true;
      economy.earn(goal.rewardCents, `Daily Goal Reward: ${goal.text}`);
      return true;
    }
    return false;
  }

  generateDailyGoals(): void {
    this.dailyGoals = DAILY_GOAL_TEMPLATES.map((tmpl) => ({
      id: tmpl.id,
      text: tmpl.text,
      target: tmpl.target,
      current: 0,
      rewardCents: tmpl.rewardCents,
      completed: false,
      claimed: false,
    }));
  }

  getCompassTarget(): { marker?: Vector3D; locationZone?: string } | null {
    const obj = this.getCurrentObjective();
    if (!obj || !obj.targetMarker) return null;
    return {
      marker: obj.targetMarker,
      locationZone: obj.targetLocation,
    };
  }
}
