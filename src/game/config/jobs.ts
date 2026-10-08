export interface OrderRecipe {
  id: string;
  name: string;
  steps: string[]; // ingredient sequence
  timeLimitSec: number;
  baseTipCents: number;
}

export interface JobDef {
  id: string;
  name: string;
  employer: string;
  locationName: string;
  description: string;
  baseHourlyRateCents: number;
  promotedHourlyRateCents: number;
  promotedAfterShifts: number;
  shiftDurationHours: number;
  openHour: number;
  closeHour: number;
  energyDrainPerShift: number;
  hungerDrainPerShift: number;
  recipes: OrderRecipe[];
}

export const JOBS: Record<string, JobDef> = {
  mels_diner: {
    id: 'mels_diner',
    name: 'Line Cook & Server',
    employer: "Mel's Diner",
    locationName: 'Mel’s Diner Pass',
    description: 'Assemble classic diner orders on the fly under the watchful eye of Mel.',
    baseHourlyRateCents: 900, // $9.00/hr -> $36 base per 4h shift
    promotedHourlyRateCents: 1050, // $10.50/hr -> $42 base per 4h shift
    promotedAfterShifts: 5,
    shiftDurationHours: 4,
    openHour: 7,
    closeHour: 20,
    energyDrainPerShift: 24,
    hungerDrainPerShift: 20,
    recipes: [
      {
        id: 'classic_burger',
        name: 'Dunmore Deluxe Burger',
        steps: ['Bottom Bun', 'Grilled Patty', 'Cheddar Cheese', 'Crisp Lettuce', 'Top Bun'],
        timeLimitSec: 14,
        baseTipCents: 350,
      },
      {
        id: 'pancake_stack',
        name: 'Butter Maple Flapjacks',
        steps: ['Golden Flapjack', 'Butter Pat', 'Maple Syrup'],
        timeLimitSec: 10,
        baseTipCents: 250,
      },
      {
        id: 'cheeseburger_fries',
        name: 'Cheeseburger & Crispy Fries',
        steps: ['Bottom Bun', 'Grilled Patty', 'Cheddar Cheese', 'Top Bun', 'Crinkle Fries'],
        timeLimitSec: 13,
        baseTipCents: 380,
      },
      {
        id: 'diner_breakfast',
        name: 'Sunrise Plate',
        steps: ['Fried Egg', 'Crispy Bacon', 'Toast Slice', 'Black Coffee'],
        timeLimitSec: 12,
        baseTipCents: 320,
      },
      {
        id: 'sweet_combo',
        name: 'Milkshake & Stack',
        steps: ['Golden Flapjack', 'Maple Syrup', 'Vanilla Shake'],
        timeLimitSec: 11,
        baseTipCents: 300,
      },
    ],
  },
};
