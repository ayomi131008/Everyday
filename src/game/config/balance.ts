export const BALANCE = {
  STARTING_MONEY_CENTS: 6000, // $60.00

  STARTING_NEEDS: {
    hunger: 80,
    energy: 90,
    hygiene: 85,
    fun: 60,
  },

  HOURLY_DECAY: {
    hunger: 4.0,
    energy: 3.0,
    hygiene: 2.0,
    fun: 2.5,
  },

  SPRINT_EXTRA_ENERGY_DECAY_HOURLY: 1.5,

  SLEEP: {
    ENERGY_RECOVERY_PER_HOUR: 12.0,
    DECAY_MULTIPLIER_DURING_SLEEP: 0.4,
  },

  RENT: {
    AMOUNT_CENTS: 9000, // $90.00
    CYCLE_DAYS: 3,
    DUE_HOUR: 18, // 6:00 PM
    LATE_FEE_CENTS: 1000, // $10.00
    WARNING_HOURS_BEFORE: 12,
  },

  EMERGENCY: {
    COLLAPSE_FEE_CENTS: 2500, // $25.00
  },

  MOVEMENT: {
    WALK_SPEED: 3.2,
    SPRINT_SPEED: 5.5,
    LOW_HUNGER_SPEED_PENALTY: 0.75, // 25% speed penalty when hunger == 0
  },

  CONSEQUENCES: {
    LOW_NEED_THRESHOLD: 30,
    LOW_HYGIENE_TIP_PENALTY: 0.7,
    LOW_FUN_TIP_PENALTY: 0.85,
  },
} as const;
