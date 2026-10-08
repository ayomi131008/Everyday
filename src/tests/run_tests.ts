import { EconomySystem } from '../game/sim/Economy';
import { NeedsSystem } from '../game/sim/Needs';
import { RentSystem } from '../game/sim/Rent';
import { JobSystem } from '../game/jobs/JobSystem';
import { DinerShiftMinigame } from '../game/jobs/DinerShiftMinigame';
import { ObjectiveSystem } from '../game/objectives/ObjectiveSystem';
import { SaveManager } from '../game/save/SaveManager';
import { JOBS } from '../game/config/jobs';
import { EventBus } from '../game/core/EventBus';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('====================================================');
console.log('RUNNING UNIT TESTS FOR EVERYDAY GAME SYSTEMS');
console.log('====================================================\n');

let passedTests = 0;

// Test 1: Economy System
console.log('[1/7] Testing EconomySystem...');
{
  const bus = new EventBus();
  const econ = new EconomySystem(6000, [], bus); // $60.00
  assert(econ.getMoneyCents() === 6000, 'Initial balance should be 6000 cents');
  assert(econ.getFormattedMoney() === '$60.00', 'Formatted money should be $60.00');

  // Earn
  const earnRes = econ.earn(1500, 'Tip');
  assert(earnRes.success && econ.getMoneyCents() === 7500, 'Earning 1500 should bring total to 7500');

  // Spend
  const spendRes = econ.spend(2000, 'Burger');
  assert(spendRes.success && econ.getMoneyCents() === 5500, 'Spending 2000 should bring total to 5500');

  // Overdraft prevention
  const overRes = econ.spend(10000, 'Expensive suit');
  assert(!overRes.success && econ.getMoneyCents() === 5500, 'Overdraft spend must fail without changing balance');

  // Force deduction
  const taken = econ.deductForce(8000, 'ER Emergency');
  assert(taken === 5500 && econ.getMoneyCents() === 0, 'Forced deduct must take only available cash down to 0, never negative');

  passedTests++;
  console.log('  ✓ Economy earning, spending, overdraft prevention, and formatting passed.');
}

// Test 2: Needs System
console.log('[2/7] Testing NeedsSystem...');
{
  const bus = new EventBus();
  let collapseFired = false;
  bus.on('playerCollapsed', () => {
    collapseFired = true;
  });

  const needs = new NeedsSystem({ hunger: 80, energy: 90, hygiene: 85, fun: 60 }, bus);

  // Hourly decay
  needs.decay(2.0, false, false);
  const n1 = needs.getNeeds();
  assert(n1.hunger === 72, 'Hunger should decay 8 in 2 hours');
  assert(n1.energy === 84, 'Energy should decay 6 in 2 hours');

  // Sleep recovery
  needs.decay(4.0, false, true); // 4 hours sleep
  const nSleep = needs.getNeeds();
  assert(nSleep.energy > 84, 'Energy should recover while sleeping');

  // Diminishing returns on repeated activity
  const r1 = needs.restore({ fun: 20 }, 'tv_watch');
  const r2 = needs.restore({ fun: 20 }, 'tv_watch');
  assert((r2.gains.fun || 0) < (r1.gains.fun || 0), 'Repeated activity should have diminished returns');

  // Exhaustion trigger
  needs.setNeeds({ energy: 0 });
  assert(collapseFired, 'Setting energy to 0 must emit playerCollapsed');

  passedTests++;
  console.log('  ✓ Needs decay, sleeping recovery, diminishing returns, and exhaustion passed.');
}

// Test 3: Rent System
console.log('[3/7] Testing RentSystem...');
{
  const econ = new EconomySystem(10000); // $100.00
  const rent = new RentSystem();

  // Due Day 3 at 18:00
  assert(rent.getTotalDueCents() === 9000, 'Total rent due should be $90.00');
  assert(rent.getHoursUntilDue(1, 8) === (2 * 24 + 10), 'Hours calculation to day 3 at 18:00 must be correct');

  // Auto-pay when due with sufficient cash
  const payRes = rent.checkDue(3, 18, econ);
  assert(Boolean(payRes.dueNow && payRes.autoPaid), 'Rent should auto-pay when solvent at due time');
  assert(econ.getMoneyCents() === 1000, 'Remaining balance should be $10.00 after $90 rent');
  assert(rent.getRentState().dueDay === 6, 'Next rent cycle should be Day 6');

  // Test late fee with broke player
  const brokeEcon = new EconomySystem(500); // $5.00
  const lateRent = new RentSystem({ dueDay: 3, dueHour: 18 });
  const lateRes = lateRent.checkDue(3, 18, brokeEcon);
  assert(Boolean(lateRes.wentLate), 'Insolvent rent check must mark rent as late');
  assert(lateRent.getTotalDueCents() === 10000, 'Late fee should add $10 making total $100');

  passedTests++;
  console.log('  ✓ Rent cycle timing, automatic solvent payment, and late fee mechanics passed.');
}

// Test 4: Job System & Diner Shift Minigame
console.log('[4/7] Testing JobSystem & DinerShiftMinigame...');
{
  const jobs = new JobSystem();
  assert(!jobs.isHired(), 'Should start unhired');
  jobs.hire();
  assert(jobs.isHired(), 'Must be hired after hire()');
  assert(jobs.getHourlyRateCents() === 900, 'Base rate should be $9.00/hr');

  // Payout calculation
  const payout = jobs.calculateShiftPayout(5, 5, 1800, 80, 80);
  assert(payout.basePayCents === 3600, '4 hours at $9 = $36.00 base pay');
  assert(payout.tipsCents === 1800, 'Tips earned should be 1800 cents');
  assert(payout.totalPayCents === 5400, 'Total pay should be $54.00');

  // Minigame ticket assembly
  const def = JOBS.mels_diner;
  const mini = new DinerShiftMinigame(def.recipes, 3);
  assert(mini.currentOrder !== null, 'Order ticket must be generated');

  const recipe = mini.currentOrder!.recipe;
  const firstStep = recipe.steps[0];
  const stepRes = mini.submitIngredient(firstStep);
  assert(stepRes.correct, 'Submitting correct first ingredient must succeed');

  const wrongRes = mini.submitIngredient('Completely Wrong Ingredient');
  assert(!wrongRes.correct, 'Submitting invalid ingredient must fail and penalize timer');

  // Promotion after 5 shifts
  for (let i = 0; i < 4; i++) {
    jobs.calculateShiftPayout(5, 5, 1500, 70, 70);
  }
  assert(jobs.getHourlyRateCents() === 1050, 'After 5 shifts, rate should promote to $10.50/hr');

  passedTests++;
  console.log('  ✓ Shift pay calculation, recipe step assembly, and promotion tiers passed.');
}

// Test 5: Objective System
console.log('[5/7] Testing ObjectiveSystem...');
{
  const bus = new EventBus();
  const econ = new EconomySystem(6000, [], bus);
  const objectives = new ObjectiveSystem(undefined, bus);

  const initialObj = objectives.getCurrentObjective();
  assert(initialObj?.id === 'explore_controls', 'First tutorial objective must be explore_controls');

  const advRes = objectives.advance('explore_controls', econ);
  assert(advRes.advanced, 'Objective must advance');
  assert(objectives.getCurrentObjective()?.id === 'reach_diner', 'Next objective should be reach_diner');

  passedTests++;
  console.log('  ✓ Objective chain advance and rewards passed.');
}

// Test 6: Save System Validation & Corrupted Recovery
console.log('[6/7] Testing SaveManager validation & sanitization...');
{
  const defaultSave = SaveManager.createDefaultSaveData();
  assert(SaveManager.validateSaveData(defaultSave), 'Default save must be valid');

  // Corrupted object missing fields
  const corrupted = {
    version: 1,
    moneyCents: 'NOT_A_NUMBER',
    needs: null,
  };
  assert(!SaveManager.validateSaveData(corrupted), 'Invalid types must fail validation');

  // Sanitizer recovery
  const sanitized = SaveManager.sanitizeAndMigrate({
    version: 1,
    moneyCents: -500, // illegal negative
    needs: { hunger: 999 }, // illegal overflow
  });
  assert(sanitized.moneyCents === 0, 'Negative money must sanitize to 0');
  assert(sanitized.needs.hunger === 100, 'Overflowing hunger must clamp to 100');

  passedTests++;
  console.log('  ✓ Save schema validation and safe sanitization passed.');
}

// Test 7: Balance Simulation (Multi-day Player Simulation)
console.log('[7/7] Running 5-Day Balance Simulation...');
{
  const econ = new EconomySystem(6000); // $60 start
  const needs = new NeedsSystem();
  const rent = new RentSystem();
  const jobs = new JobSystem();
  jobs.hire();

  console.log('  Simulating 5 in-game days for an average player:');

  for (let day = 1; day <= 5; day++) {
    // 08:00 - Morning meal ($4 sandwich or pancakes)
    econ.spend(400, 'Breakfast sandwich');
    needs.restore({ hunger: 32 });

    // 10:00 - 14:00 Work 4-hour diner shift
    const shiftSummary = jobs.calculateShiftPayout(5, 5, 1600, needs.getNeeds().hygiene, needs.getNeeds().fun);
    econ.earn(shiftSummary.totalPayCents, 'Shift pay');
    needs.decay(4.0);

    // 14:30 - Diner lunch ($6 pancakes)
    econ.spend(600, 'Diner lunch');
    needs.restore({ hunger: 38 });

    // 16:00 - Afternoon park fun
    needs.restore({ fun: 18 });

    // 18:00 - Evening rent check
    rent.checkDue(day, 18, econ);

    // 20:00 - Shower
    needs.restore({ hygiene: 100 });

    // 22:00 - 8 hours sleep
    needs.decay(8.0, false, true);

    console.log(`    Day ${day} Ended: Balance = ${econ.getFormattedMoney()} | Hunger = ${needs.getNeeds().hunger}% | Energy = ${needs.getNeeds().energy}%`);
  }

  // Solvency assertions
  assert(econ.getMoneyCents() > 0, 'Player must remain solvent after 5 days with 1 shift/day');
  assert(econ.getMoneyCents() < 35000, 'Player should not get unrealistically wealthy ($350+) too fast');
  assert(!rent.getRentState().isLate, 'Rent should have been paid on Day 3 without going late');

  passedTests++;
  console.log('  ✓ 5-day economic balance validated: sustainable routine without rapid hyper-inflation.');
}

console.log('\n====================================================');
console.log(`ALL ${passedTests} TEST SUITES PASSED CLEANLY!`);
console.log('====================================================\n');
