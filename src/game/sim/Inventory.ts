import { ITEMS, ItemDef } from '../config/items';
import { EventBus } from '../core/EventBus';
import { InventoryItem } from '../core/Types';

export class InventorySystem {
  private items: Map<string, number> = new Map();

  constructor(initialItems: InventoryItem[] = [], private eventBus?: EventBus) {
    for (const item of initialItems) {
      if (item.quantity > 0 && ITEMS[item.id]) {
        this.items.set(item.id, item.quantity);
      }
    }
  }

  getItems(): InventoryItem[] {
    const list: InventoryItem[] = [];
    for (const [id, quantity] of this.items.entries()) {
      list.push({ id, quantity });
    }
    return list;
  }

  getItemDef(id: string): ItemDef | undefined {
    return ITEMS[id];
  }

  getQuantity(id: string): number {
    return this.items.get(id) || 0;
  }

  addItem(id: string, count: number = 1): boolean {
    if (count <= 0 || !ITEMS[id]) return false;
    const current = this.items.get(id) || 0;
    this.items.set(id, current + count);
    this.eventBus?.emit('inventoryChanged', this.getItems());
    return true;
  }

  removeItem(id: string, count: number = 1): boolean {
    const current = this.items.get(id) || 0;
    if (current < count) return false;
    const remaining = current - count;
    if (remaining <= 0) {
      this.items.delete(id);
    } else {
      this.items.set(id, remaining);
    }
    this.eventBus?.emit('inventoryChanged', this.getItems());
    return true;
  }

  hasItem(id: string, count: number = 1): boolean {
    return (this.items.get(id) || 0) >= count;
  }

  cookItem(rawId: string): { success: boolean; resultId?: string; message: string } {
    const def = ITEMS[rawId];
    if (!def || !def.requiresCooking || !def.cookedResultId) {
      return { success: false, message: 'This item cannot be cooked.' };
    }
    if (!this.removeItem(rawId, 1)) {
      return { success: false, message: 'You do not have this ingredient.' };
    }
    this.addItem(def.cookedResultId, 1);
    return {
      success: true,
      resultId: def.cookedResultId,
      message: `Cooked ${def.name} on the hot plate! Hot and ready to eat.`,
    };
  }
}
