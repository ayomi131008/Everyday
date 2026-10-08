import { Vector3D } from '../core/Types';

export interface InteractableDef {
  id: string;
  label: string;
  verb: string;
  position: Vector3D;
  zone: 'exterior' | 'apartment' | 'diner' | 'convenience';
  range?: number; // default 2.3m
  condition?: () => { canInteract: boolean; disabledReason?: string };
  action: () => void;
}

export class InteractionSystem {
  private interactables: Map<string, InteractableDef> = new Map();
  private lastTriggerTime: number = 0;
  private debounceMs: number = 400;

  register(def: InteractableDef): void {
    this.interactables.set(def.id, def);
  }

  unregister(id: string): void {
    this.interactables.delete(id);
  }

  clear(): void {
    this.interactables.clear();
  }

  findActivePrompt(
    playerPos: Vector3D,
    currentZone: 'exterior' | 'apartment' | 'diner' | 'convenience'
  ): {
    interactable: InteractableDef;
    disabledReason?: string;
    distance: number;
  } | null {
    let closest: {
      interactable: InteractableDef;
      disabledReason?: string;
      distance: number;
    } | null = null;
    let minDistance = Infinity;

    for (const item of this.interactables.values()) {
      if (item.zone !== currentZone) continue;

      const dx = playerPos.x - item.position.x;
      const dy = (playerPos.y || 0.9) - item.position.y;
      const dz = playerPos.z - item.position.z;
      const dist = Math.hypot(dx, dy, dz);
      const maxRange = item.range || 2.4;

      if (dist <= maxRange && dist < minDistance) {
        minDistance = dist;
        let disabledReason: string | undefined;
        if (item.condition) {
          const cond = item.condition();
          if (!cond.canInteract) {
            disabledReason = cond.disabledReason || 'Unavailable right now';
          }
        }

        closest = {
          interactable: item,
          disabledReason,
          distance: dist,
        };
      }
    }

    return closest;
  }

  trigger(
    playerPos: Vector3D,
    currentZone: 'exterior' | 'apartment' | 'diner' | 'convenience'
  ): boolean {
    const now = Date.now();
    if (now - this.lastTriggerTime < this.debounceMs) {
      return false;
    }

    const target = this.findActivePrompt(playerPos, currentZone);
    if (!target) return false;

    if (target.disabledReason) {
      return false; // disabled
    }

    this.lastTriggerTime = now;
    try {
      target.interactable.action();
      return true;
    } catch (err) {
      console.error('Error executing interaction:', err);
      return false;
    }
  }
}
