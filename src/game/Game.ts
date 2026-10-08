import { Engine, Scene, Vector3 } from '@babylonjs/core';
import { BALANCE } from './config/balance';
import { ITEMS } from './config/items';
import { LOCATIONS } from './config/locations';
import { TUTORIAL_CHAIN } from './config/objectives';
import { AudioManager, globalAudio } from './audio/AudioManager';
import { Clock } from './core/Clock';
import { EventBus, globalEvents } from './core/EventBus';
import {
  GameSettings,
  GameStatePhase,
  InteractionPrompt,
  NeedsState,
  SaveData,
  ToastMessage,
  Vector3D,
} from './core/Types';
import { InputManager } from './input/InputManager';
import { InteractableDef, InteractionSystem } from './interaction/InteractionSystem';
import { DinerShiftMinigame } from './jobs/DinerShiftMinigame';
import { JobSystem, ShiftSummary } from './jobs/JobSystem';
import { ObjectiveSystem } from './objectives/ObjectiveSystem';
import { CameraRig } from './player/CameraRig';
import { createProceduralCharacter } from './player/CharacterModel';
import { PlayerController } from './player/PlayerController';
import { SceneContext, setupBabylonScene } from './render/SceneSetup';
import { SaveManager } from './save/SaveManager';
import { EconomySystem } from './sim/Economy';
import { InventorySystem } from './sim/Inventory';
import { NeedsSystem } from './sim/Needs';
import { RentSystem } from './sim/Rent';
import { buildDunmoreSquare } from './world/WorldBuilder';
import { CollisionSystem } from './world/Colliders';

export interface GameSnapshot {
  phase: GameStatePhase;
  moneyCents: number;
  formattedMoney: string;
  timeString: string;
  dayString: string;
  period: string;
  needs: NeedsState;
  currentObjective?: {
    id: string;
    title: string;
    instruction: string;
  };
  prompt: InteractionPrompt | null;
  currentZone: 'exterior' | 'apartment' | 'diner' | 'convenience';
  zoneName: string;
  rentDaysRemaining: number;
  rentTotalDueCents: number;
  rentIsLate: boolean;
  activeShopCategory: 'diner' | 'convenience' | null;
  activeModal: 'inventory' | 'shop' | 'pause' | 'settings' | 'sleep' | 'dialogue' | 'shift_summary' | null;
  dialogueContent?: { title: string; lines: string[]; actionLabel?: string; onAction?: () => void };
  shiftSummary?: ShiftSummary;
  fps: number;
}

export class Game {
  public phase: GameStatePhase = 'title';
  public eventBus: EventBus;
  public clock: Clock;
  public economy: EconomySystem;
  public needs: NeedsSystem;
  public inventory: InventorySystem;
  public rent: RentSystem;
  public jobs: JobSystem;
  public objectives: ObjectiveSystem;
  public interactionSystem: InteractionSystem;
  public collisionSystem: CollisionSystem;

  public sceneCtx!: SceneContext;
  public inputManager!: InputManager;
  public cameraRig!: CameraRig;
  public playerController!: PlayerController;
  public audio: AudioManager = globalAudio;

  public activeMinigame: DinerShiftMinigame | null = null;
  public activeShopCategory: 'diner' | 'convenience' | null = null;
  public activeModal: 'inventory' | 'shop' | 'pause' | 'settings' | 'sleep' | 'dialogue' | 'shift_summary' | null = null;
  public dialogueContent?: { title: string; lines: string[]; actionLabel?: string; onAction?: () => void };
  public lastShiftSummary?: ShiftSummary;

  private settings: GameSettings;
  private subscribers: Set<() => void> = new Set();
  private isDestroyed: boolean = false;
  private lastAutosaveTime: number = 0;
  private currentPrompt: InteractionPrompt | null = null;
  private fpsCounter: number = 60;
  private totalMetersMoved: number = 0;
  private doorMarkers: Record<string, Vector3> = {};
  private cachedSnapshot: GameSnapshot | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    initialSaveData?: SaveData
  ) {
    this.eventBus = globalEvents;
    const save = initialSaveData || SaveManager.createDefaultSaveData();

    this.settings = { ...save.settings };
    this.clock = new Clock(this.eventBus);
    this.clock.setTime(save.time.day, save.time.hour, save.time.minute);

    this.economy = new EconomySystem(save.moneyCents, save.recentTransactions, this.eventBus);
    this.needs = new NeedsSystem(save.needs, this.eventBus);
    this.inventory = new InventorySystem(save.inventory, this.eventBus);
    this.rent = new RentSystem(save.rent, this.eventBus);
    this.jobs = new JobSystem(save.job, this.eventBus);
    this.objectives = new ObjectiveSystem(save.objectives, this.eventBus);
    this.interactionSystem = new InteractionSystem();
    this.collisionSystem = new CollisionSystem();

    this.initRenderAndWorld(save);
    this.initInputAndInteractions();
    this.registerEventListeners();
    this.audio.applySettings(this.settings);
    this.updateCachedSnapshot();

    // Expose dev tools for debugging / QA verification
    if (typeof window !== 'undefined') {
      (window as any).__everyday = {
        addMoney: (cents: number) => this.economy.earn(cents, 'Dev debug cheat'),
        setNeed: (need: keyof NeedsState, val: number) => this.needs.setNeeds({ [need]: val }),
        teleport: (x: number, y: number, z: number, zone: any) => this.playerController.teleport({ x, y, z }, zone),
        advanceTimeHours: (hours: number) => this.clock.advanceMinutes(hours * 60),
        getState: () => this.getSnapshot(),
        save: () => this.saveGame(),
      };
    }
  }

  private initRenderAndWorld(save: SaveData): void {
    this.sceneCtx = setupBabylonScene(this.canvas, this.settings.graphicsQuality);

    // Build Dunmore Square and interiors
    const world = buildDunmoreSquare(this.sceneCtx.scene, this.sceneCtx.materials, this.collisionSystem);
    this.doorMarkers = world.doorMarkers;

    // Build Player Rig & Camera
    this.cameraRig = new CameraRig(this.sceneCtx.scene, this.canvas);
    const charRig = createProceduralCharacter(this.sceneCtx.scene, this.sceneCtx.materials, 'player');

    this.playerController = new PlayerController(
      charRig,
      this.cameraRig,
      this.collisionSystem,
      this.needs,
      save.player.position
    );
    this.playerController.rotationY = save.player.rotationY;
    this.playerController.currentZone = save.player.currentZone;

    // If starting in title mode, set camera to slow orbit
    this.cameraRig.setOrbitMode(true);
  }

  private initInputAndInteractions(): void {
    this.inputManager = new InputManager(this.canvas);

    // Register interact key (E)
    this.inputManager.onInteract(() => {
      if (this.phase === 'playing' && !this.activeModal) {
        this.interactionSystem.trigger(
          this.playerController.position,
          this.playerController.currentZone
        );
      }
    });

    // Register Inventory key (Tab / I)
    this.inputManager.onInventory(() => {
      if (this.phase === 'playing') {
        if (this.activeModal === 'inventory') {
          this.closeModal();
        } else if (!this.activeModal) {
          this.openModal('inventory');
        }
      }
    });

    // Register Pause key (Esc)
    this.inputManager.onPause(() => {
      if (this.phase === 'playing') {
        if (this.activeModal) {
          this.closeModal();
        } else {
          this.pauseGame();
        }
      } else if (this.phase === 'paused') {
        this.resumeGame();
      }
    });

    this.setupWorldInteractables();
  }

  private setupWorldInteractables(): void {
    this.interactionSystem.clear();

    // 1. Lindqvist Arms Exterior Door -> Enter Apartment
    this.interactionSystem.register({
      id: 'apt_door_ext',
      label: 'Enter Lindqvist Arms (Apt 2B)',
      verb: 'Enter Room',
      position: { x: 16, y: 0.9, z: -9.5 },
      zone: 'exterior',
      range: 2.5,
      action: () => {
        this.audio.playDoor();
        this.playerController.teleport({ x: 95, y: 0.9, z: 0 }, 'apartment');
        this.audio.setZoneIndoors(true);
        this.notify('Lindqvist Arms', 'Home sweet room. Quiet and rent-controlled.');
      },
    });

    // 2. Lindqvist Arms Interior Door -> Exit to Dunmore Square
    this.interactionSystem.register({
      id: 'apt_door_int',
      label: 'Exit to Dunmore Square',
      verb: 'Step Outside',
      position: { x: 93.6, y: 0.9, z: 0 },
      zone: 'apartment',
      range: 2.4,
      action: () => {
        this.audio.playDoor();
        this.playerController.teleport({ x: 16, y: 0.9, z: -8 }, 'exterior');
        this.audio.setZoneIndoors(false);
        this.notify('Dunmore Square', 'Brightwater breeze and the rumble of traffic.');
      },
    });

    // 3. Apartment Bed -> Sleep Modal
    this.interactionSystem.register({
      id: 'apt_bed',
      label: 'Warm Mattress & Duffel Pillow',
      verb: 'Sleep / Rest',
      position: { x: 104.5, y: 0.9, z: 3.5 },
      zone: 'apartment',
      range: 2.4,
      action: () => {
        this.openModal('sleep');
      },
    });

    // 4. Apartment Shower -> Shower
    this.interactionSystem.register({
      id: 'apt_shower',
      label: 'Hot Shower Stall',
      verb: 'Take Hot Shower',
      position: { x: 95.5, y: 0.9, z: 4.5 },
      zone: 'apartment',
      range: 2.4,
      action: () => {
        this.audio.playDoor();
        this.clock.advanceMinutes(25);
        this.needs.restore({ hygiene: 100 });
        this.objectives.reportDailyProgress('daily_hygiene', 1);
        if (this.objectives.getState().currentId === 'rest_or_clean') {
          this.objectives.advance('rest_or_clean', this.economy);
        }
        this.notify('Steamy Shower', 'Hygiene restored to 100%! Ready to face the city.');
        this.notifyStateChanged();
      },
    });

    // 5. Apartment Hot Plate -> Cook Noodles
    this.interactionSystem.register({
      id: 'apt_hotplate',
      label: 'Electric Hot Plate',
      verb: 'Cook Instant Meal',
      position: { x: 104, y: 0.9, z: -4.5 },
      zone: 'apartment',
      range: 2.4,
      condition: () => {
        const hasRaw = this.inventory.hasItem('noodle_cup_raw', 1);
        return {
          canInteract: hasRaw,
          disabledReason: hasRaw ? undefined : 'Need Instant Noodle Cup from QuikStop',
        };
      },
      action: () => {
        this.audio.playGrillSizzle();
        this.clock.advanceMinutes(10);
        const result = this.inventory.cookItem('noodle_cup_raw');
        this.notify('Cooking', result.message);
        this.notifyStateChanged();
      },
    });

    // 6. Apartment TV -> Watch TV
    this.interactionSystem.register({
      id: 'apt_tv',
      label: 'Vintage CRT Television',
      verb: 'Watch Cable TV',
      position: { x: 95.5, y: 0.9, z: -4.2 },
      zone: 'apartment',
      range: 2.4,
      action: () => {
        this.audio.playUiClick();
        this.clock.advanceMinutes(45);
        const res = this.needs.restore({ fun: 24, energy: -3 }, 'tv_watch');
        this.notify('Cable TV', res.message || 'Watched local Brightwater river news and weird infomercials. (+Fun)');
        this.notifyStateChanged();
      },
    });

    // 7. Apartment Rent Notice Board -> Pay Rent
    this.interactionSystem.register({
      id: 'apt_rent_board',
      label: 'Lindqvist Management Mail Slot & Notice Board',
      verb: 'Review & Pay Rent',
      position: { x: 93.8, y: 0.9, z: 1.8 },
      zone: 'apartment',
      range: 2.4,
      action: () => {
        const dueCents = this.rent.getTotalDueCents();
        const curTime = this.clock.getTime();
        const hrs = this.rent.getHoursUntilDue(curTime.day, curTime.hour);

        if (this.economy.canAfford(dueCents)) {
          const res = this.rent.payManually(this.economy, curTime.day);
          this.audio.playCoin();
          this.notify('Rent Paid!', res.message, 'success');
          if (this.objectives.getState().currentId === 'pay_rent') {
            this.objectives.advance('pay_rent', this.economy);
          }
        } else {
          this.audio.playError();
          this.notify(
            'Rent Due',
            `You need ${EconomySystem.formatCents(dueCents)} to pay rent (${Math.max(0, Math.round(hrs))}h left). Work more shifts!`,
            'warning'
          );
        }
        this.notifyStateChanged();
      },
    });

    // 8. Mel's Diner Exterior Door -> Enter Diner
    this.interactionSystem.register({
      id: 'diner_door_ext',
      label: "Mel's 24/7 Diner",
      verb: 'Enter Diner',
      position: { x: -16, y: 0.9, z: 9.5 },
      zone: 'exterior',
      range: 2.5,
      condition: () => {
        const hr = this.clock.getTime().hour;
        const open = hr >= LOCATIONS.diner.openHour! && hr < LOCATIONS.diner.closeHour!;
        return {
          canInteract: open,
          disabledReason: open ? undefined : 'Closed for cleaning (Open 6 AM - 9 PM)',
        };
      },
      action: () => {
        this.audio.playDoor();
        this.playerController.teleport({ x: 193, y: 0.9, z: 0 }, 'diner');
        this.audio.setZoneIndoors(true);
        if (this.objectives.getState().currentId === 'reach_diner') {
          this.objectives.advance('reach_diner', this.economy);
        }
        this.notify("Mel's Diner", 'Smells like bacon grease and freshly brewed coffee.');
      },
    });

    // 9. Mel's Diner Interior Door -> Exit Diner
    this.interactionSystem.register({
      id: 'diner_door_int',
      label: 'Exit to Dunmore Square',
      verb: 'Step Outside',
      position: { x: 191.8, y: 0.9, z: 0 },
      zone: 'diner',
      range: 2.4,
      action: () => {
        this.audio.playDoor();
        this.playerController.teleport({ x: -16, y: 0.9, z: 8 }, 'exterior');
        this.audio.setZoneIndoors(false);
      },
    });

    // 10. Manager Mel / Time Clock -> Job Hiring & Clock-in
    this.interactionSystem.register({
      id: 'diner_manager_mel',
      label: "Mel (Diner Manager & Owner)",
      verb: this.jobs.isHired() ? 'Clock in for Shift' : 'Talk about Job Opening',
      position: { x: 203.2, y: 0.9, z: 4.8 },
      zone: 'diner',
      range: 2.5,
      action: () => {
        if (!this.jobs.isHired()) {
          this.dialogueContent = {
            title: "Manager Mel",
            lines: [
              "Well hey there kid. You look like you're fresh off the bus.",
              "Our last grill cook burned their eyebrows and took off for Seattle. I need someone right now.",
              "Pay is $9.00 an hour, plus whatever tips customers leave if the food isn't raw. Interested?",
            ],
            actionLabel: "Take the Job!",
            onAction: () => {
              this.jobs.hire();
              this.audio.playCoin();
              this.notify("You're Hired!", "Welcome to Mel's Diner line cook crew. Clock in at the kitchen pass.");
              if (this.objectives.getState().currentId === 'apply_job') {
                this.objectives.advance('apply_job', this.economy);
              }
              this.closeModal();
            },
          };
          this.openModal('dialogue');
        } else {
          // Check hours
          const hour = this.clock.getTime().hour;
          const def = this.jobs.getJobDef();
          if (hour < def.openHour || hour > def.closeHour) {
            this.audio.playError();
            this.notify("Kitchen Closed", `Shifts run between ${def.openHour}:00 AM and ${def.closeHour - 12}:00 PM.`);
            return;
          }
          this.startDinerShift();
        }
      },
    });

    // 11. Diner Kitchen Pass / Shift Station
    this.interactionSystem.register({
      id: 'diner_shift_station',
      label: "Mel's Kitchen Pass & Griddle",
      verb: 'Work Cooking Shift',
      position: { x: 205.5, y: 0.9, z: 0 },
      zone: 'diner',
      range: 2.5,
      condition: () => {
        if (!this.jobs.isHired()) {
          return { canInteract: false, disabledReason: 'Talk to Manager Mel first' };
        }
        const hour = this.clock.getTime().hour;
        const def = this.jobs.getJobDef();
        const open = hour >= def.openHour && hour < def.closeHour;
        return { canInteract: open, disabledReason: open ? undefined : 'Diner kitchen is closed for the night' };
      },
      action: () => {
        this.startDinerShift();
      },
    });

    // 12. Diner Counter -> Order Meals (Shop)
    this.interactionSystem.register({
      id: 'diner_counter_shop',
      label: "Mel's Order Counter",
      verb: 'Order Hot Meal',
      position: { x: 202.5, y: 0.9, z: -2.0 },
      zone: 'diner',
      range: 2.5,
      action: () => {
        this.activeShopCategory = 'diner';
        this.openModal('shop');
      },
    });

    // 13. Diner Jukebox
    this.interactionSystem.register({
      id: 'diner_jukebox',
      label: 'Wurlitzer Neon Jukebox',
      verb: 'Play Song ($1.00)',
      position: { x: 193.5, y: 0.9, z: -7.0 },
      zone: 'diner',
      range: 2.4,
      condition: () => {
        return {
          canInteract: this.economy.canAfford(100),
          disabledReason: this.economy.canAfford(100) ? undefined : 'Need $1.00 cash',
        };
      },
      action: () => {
        this.economy.spend(100, 'Jukebox tune at Mel’s Diner');
        this.audio.playCoin();
        const res = this.needs.restore({ fun: 18 }, 'jukebox');
        this.notify('Jukebox Groove', res.message || 'Golden oldies fill the diner. Nostalgic and cheerful! (+Fun)');
        this.notifyStateChanged();
      },
    });

    // 14. QuikStop Corner Market Exterior Door
    this.interactionSystem.register({
      id: 'store_door_ext',
      label: 'QuikStop Corner Market',
      verb: 'Enter QuikStop',
      position: { x: -16, y: 0.9, z: -13.5 },
      zone: 'exterior',
      range: 2.5,
      condition: () => {
        const hr = this.clock.getTime().hour;
        const open = hr >= LOCATIONS.convenience.openHour! && hr < LOCATIONS.convenience.closeHour!;
        return {
          canInteract: open,
          disabledReason: open ? undefined : 'Closed (Open 6 AM - 11 PM)',
        };
      },
      action: () => {
        this.audio.playDoor();
        this.playerController.teleport({ x: 294, y: 0.9, z: 0 }, 'convenience');
        this.audio.setZoneIndoors(true);
        this.notify('QuikStop Market', 'Fluorescent lights humming over rows of snacks and energy drinks.');
      },
    });

    // 15. QuikStop Interior Door -> Exit
    this.interactionSystem.register({
      id: 'store_door_int',
      label: 'Exit to Dunmore Square',
      verb: 'Step Outside',
      position: { x: 292.8, y: 0.9, z: 0 },
      zone: 'convenience',
      range: 2.4,
      action: () => {
        this.audio.playDoor();
        this.playerController.teleport({ x: -16, y: 0.9, z: -14 }, 'exterior');
        this.audio.setZoneIndoors(false);
      },
    });

    // 16. QuikStop Cashier Counter -> Shop
    this.interactionSystem.register({
      id: 'store_cashier_shop',
      label: 'QuikStop Register & Shelves',
      verb: 'Shop Groceries & Snacks',
      position: { x: 296.5, y: 0.9, z: 3.0 },
      zone: 'convenience',
      range: 2.5,
      action: () => {
        this.activeShopCategory = 'convenience';
        this.openModal('shop');
      },
    });

    // 17. Dunmore Park Basketball Hoop
    this.interactionSystem.register({
      id: 'park_basketball',
      label: 'Dunmore Park Court & Hoop',
      verb: 'Shoot Some Hoops',
      position: { x: 24, y: 0.9, z: 28.5 },
      zone: 'exterior',
      range: 3.0,
      action: () => {
        this.audio.playFootstep();
        this.clock.advanceMinutes(30);
        const res = this.needs.restore({ fun: 22, energy: -6, hunger: -3 }, 'park_hoops');
        this.objectives.reportDailyProgress('daily_park', 1);
        this.notify('Dunmore Hoops', res.message || 'Swished three jumpers in a row! Great fresh air. (+Fun)');
        this.notifyStateChanged();
      },
    });

    // 18. Dunmore Park Bench
    this.interactionSystem.register({
      id: 'park_bench',
      label: 'Sunny Park Bench',
      verb: 'Sit & People-Watch',
      position: { x: 18, y: 0.9, z: 20 },
      zone: 'exterior',
      range: 2.5,
      action: () => {
        this.clock.advanceMinutes(35);
        const res = this.needs.restore({ fun: 14, energy: 4 }, 'park_bench');
        this.notify('Park Relaxation', res.message || 'Watched pigeons and cyclists cruise along Pell Street. (+Rest)');
        this.notifyStateChanged();
      },
    });
  }

  private registerEventListeners(): void {
    // Hourly decay & rent check
    this.eventBus.on('hourPassed', (time: { day: number; hour: number }) => {
      // Decay needs
      this.needs.decay(1.0, false, false);

      // Rent due check
      const rentResult = this.rent.checkDue(time.day, time.hour, this.economy);
      if (rentResult.message) {
        this.notify('Housing Notice', rentResult.message, rentResult.wentLate ? 'alert' : 'info');
      }

      // Autosave once every in-game hour
      this.saveGame();
      this.notifyStateChanged();
    });

    // Need critical alerts
    this.eventBus.on('needCritical', ({ need, value }: { need: string; value: number }) => {
      this.notify(
        `Low ${need.toUpperCase()}`,
        `Your ${need} is down to ${Math.round(value)}! Take care of yourself soon.`,
        'warning'
      );
    });

    // Player collapse safeguard (energy = 0)
    this.eventBus.on('playerCollapsed', () => {
      this.handlePlayerExhaustionCollapse();
    });
  }

  private handlePlayerExhaustionCollapse(): void {
    // ER Copay fee deducted
    const feeTaken = this.economy.deductForce(BALANCE.EMERGENCY.COLLAPSE_FEE_CENTS, 'ER transport & clinic copay');
    this.audio.playError();

    // Advance 6 hours, restore energy to 45
    this.clock.advanceMinutes(360);
    this.needs.setNeeds({ energy: 45, hunger: Math.max(20, this.needs.getNeeds().hunger) });

    // Teleport player back to apartment bed
    this.playerController.teleport({ x: 104, y: 0.9, z: 3.5 }, 'apartment');
    this.audio.setZoneIndoors(true);

    this.notify(
      'Passed Out from Exhaustion!',
      `You collapsed in Brightwater and woke up in your room. A paramedic bill of ${EconomySystem.formatCents(feeTaken)} was deducted.`,
      'alert',
      6000
    );

    this.notifyStateChanged();
  }

  public startDinerShift(): void {
    const jobDef = this.jobs.getJobDef();
    this.activeMinigame = new DinerShiftMinigame(jobDef.recipes, 5);
    this.phase = 'minigame';
    this.audio.playGrillSizzle();
    this.notify('Shift Started!', 'Cook customer orders accurately and quickly to earn base pay & big tips.');
    this.notifyStateChanged();
  }

  public completeShift(): void {
    if (!this.activeMinigame) return;

    const needs = this.needs.getNeeds();
    const summary = this.jobs.calculateShiftPayout(
      this.activeMinigame.ordersCompletedCount,
      this.activeMinigame.orders.length,
      this.activeMinigame.totalTipsCents,
      needs.hygiene,
      needs.fun
    );

    // Apply pay to economy
    this.economy.earn(summary.totalPayCents, `Shift earnings: Mel's Diner (${summary.ordersCompleted}/${summary.totalOrders} orders)`);
    this.audio.playCoin();

    // Advance 4 in-game hours & drain needs naturally
    this.clock.advanceMinutes(4 * 60);
    this.needs.decay(4.0);

    // Objectives check
    if (this.objectives.getState().currentId === 'complete_shift') {
      this.objectives.advance('complete_shift', this.economy);
    }
    this.objectives.reportDailyProgress('daily_earn', summary.totalPayCents);
    this.objectives.reportDailyProgress('daily_diner_shift', 1);

    this.lastShiftSummary = summary;
    this.activeMinigame = null;
    this.phase = 'playing';
    this.openModal('shift_summary');
    this.notifyStateChanged();
  }

  public cancelShift(): void {
    this.activeMinigame = null;
    this.phase = 'playing';
    this.notify('Shift Forfeited', 'You walked off the line early. No wages were earned for this shift.', 'warning');
    this.notifyStateChanged();
  }

  public buyItem(itemId: string): void {
    const item = ITEMS[itemId];
    if (!item) return;

    if (!this.economy.canAfford(item.priceCents)) {
      this.audio.playError();
      this.notify('Cannot Afford', `You need ${EconomySystem.formatCents(item.priceCents)} for ${item.name}.`, 'warning');
      return;
    }

    this.economy.spend(item.priceCents, `Bought ${item.name}`);
    this.audio.playCoin();

    if (item.category === 'diner') {
      // Diner meals are eaten immediately fresh at the counter
      this.needs.restore({
        hunger: item.hunger,
        energy: item.energy,
        hygiene: item.hygiene,
        fun: item.fun,
      });
      this.notify('Enjoying Meal', item.consumeMessage || `Ate ${item.name}! Hot and fresh.`);
      if (this.objectives.getState().currentId === 'buy_food') {
        this.objectives.advance('buy_food', this.economy);
      }
    } else {
      // QuikStop groceries go into inventory
      this.inventory.addItem(item.id, 1);
      this.notify('Purchased', `Added ${item.name} to your inventory.`);
    }

    this.notifyStateChanged();
  }

  public consumeInventoryItem(itemId: string): void {
    const item = ITEMS[itemId];
    if (!item || !item.consumable) return;

    if (this.inventory.removeItem(itemId, 1)) {
      this.audio.playUiClick();
      this.needs.restore({
        hunger: item.hunger,
        energy: item.energy,
        hygiene: item.hygiene,
        fun: item.fun,
      });
      this.notify('Used Item', item.consumeMessage || `Consumed ${item.name}.`);
      if (this.objectives.getState().currentId === 'buy_food' && item.hunger > 10) {
        this.objectives.advance('buy_food', this.economy);
      }
      this.notifyStateChanged();
    }
  }

  public sleep(hours: number): void {
    this.audio.playDoor();
    this.clock.advanceMinutes(hours * 60);
    this.needs.decay(hours, false, true); // sleeping decay

    if (this.objectives.getState().currentId === 'rest_or_clean') {
      this.objectives.advance('rest_or_clean', this.economy);
    }

    this.closeModal();
    const time = this.clock.getFormattedTime();
    this.notify('Good Morning!', `Rested for ${hours} hours. It is now ${time.timeString} ${time.period} on ${time.dayString}.`, 'success');
    this.saveGame();
    this.notifyStateChanged();
  }

  public startNewGame(): void {
    this.audio.unlock();
    const defaultData = SaveManager.createDefaultSaveData();
    SaveManager.deleteSave();

    this.economy = new EconomySystem(defaultData.moneyCents, [], this.eventBus);
    this.needs = new NeedsSystem(defaultData.needs, this.eventBus);
    this.inventory = new InventorySystem(defaultData.inventory, this.eventBus);
    this.rent = new RentSystem(defaultData.rent, this.eventBus);
    this.jobs = new JobSystem(defaultData.job, this.eventBus);
    this.objectives = new ObjectiveSystem(defaultData.objectives, this.eventBus);
    this.clock.setTime(defaultData.time.day, defaultData.time.hour, defaultData.time.minute);

    this.playerController.teleport(defaultData.player.position, defaultData.player.currentZone);
    this.cameraRig.setOrbitMode(false);
    this.phase = 'playing';
    this.inputManager.requestPointerLock();
    this.notify('Welcome to Brightwater!', 'Use WASD to explore Dunmore Square. Look with mouse.', 'info', 5000);
    this.notifyStateChanged();
  }

  public continueGame(): void {
    this.audio.unlock();
    const { data } = SaveManager.load();

    this.economy = new EconomySystem(data.moneyCents, data.recentTransactions, this.eventBus);
    this.needs = new NeedsSystem(data.needs, this.eventBus);
    this.inventory = new InventorySystem(data.inventory, this.eventBus);
    this.rent = new RentSystem(data.rent, this.eventBus);
    this.jobs = new JobSystem(data.job, this.eventBus);
    this.objectives = new ObjectiveSystem(data.objectives, this.eventBus);
    this.clock.setTime(data.time.day, data.time.hour, data.time.minute);

    this.playerController.teleport(data.player.position, data.player.currentZone);
    this.audio.setZoneIndoors(data.player.currentZone !== 'exterior');
    this.cameraRig.setOrbitMode(false);
    this.phase = 'playing';
    this.inputManager.requestPointerLock();
    this.notify('Progress Loaded', `Welcome back to Brightwater (${this.clock.getFormattedTime().dayString}).`);
    this.notifyStateChanged();
  }

  public pauseGame(): void {
    this.phase = 'paused';
    this.clock.setPaused(true);
    this.inputManager.exitPointerLock();
    this.openModal('pause');
  }

  public resumeGame(): void {
    this.phase = 'playing';
    this.clock.setPaused(false);
    this.closeModal();
    this.inputManager.requestPointerLock();
  }

  public quitToTitle(): void {
    this.saveGame();
    this.phase = 'title';
    this.closeModal();
    this.cameraRig.setOrbitMode(true);
    this.inputManager.exitPointerLock();
    this.notifyStateChanged();
  }

  public openModal(modal: typeof this.activeModal): void {
    this.activeModal = modal;
    this.inputManager.exitPointerLock();
    this.notifyStateChanged();
  }

  public closeModal(): void {
    this.activeModal = null;
    this.dialogueContent = undefined;
    if (this.phase === 'playing') {
      this.inputManager.requestPointerLock();
    }
    this.notifyStateChanged();
  }

  public applySettings(newSettings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.audio.applySettings(this.settings);
    this.sceneCtx.applyQuality(this.settings.graphicsQuality);
    this.notifyStateChanged();
  }

  public saveGame(): void {
    const pos = this.playerController.position;
    const time = this.clock.getTime();
    const data: SaveData = {
      version: 1,
      savedAt: Date.now(),
      checksum: '',
      moneyCents: this.economy.getMoneyCents(),
      needs: this.needs.getNeeds(),
      time: {
        day: time.day,
        hour: time.hour,
        minute: time.minute,
      },
      player: {
        position: { x: pos.x, y: pos.y, z: pos.z },
        rotationY: this.playerController.rotationY,
        currentZone: this.playerController.currentZone,
      },
      inventory: this.inventory.getItems(),
      job: this.jobs.getProgress(),
      rent: this.rent.getRentState(),
      objectives: this.objectives.getState(),
      settings: this.settings,
      lifestyleTier: 0,
      recentTransactions: this.economy.getRecentTransactions(),
    };
    SaveManager.save(data);
  }

  public notify(title: string, description?: string, type: ToastMessage['type'] = 'info', durationMs: number = 3500): void {
    this.eventBus.emit('toast', {
      id: `toast_${Date.now()}_${Math.random()}`,
      title,
      description,
      type,
      durationMs,
    });
  }

  // Main game tick (invoked by Babylon render loop)
  public tick(deltaSec: number): void {
    if (this.isDestroyed) return;

    // 1. Minigame tick if active
    if (this.phase === 'minigame' && this.activeMinigame) {
      this.activeMinigame.update(deltaSec);
      if (this.activeMinigame.isFinished) {
        this.completeShift();
      }
      return;
    }

    // 2. Title cinematic orbit
    if (this.phase === 'title') {
      this.cameraRig.update(new Vector3(0, 0, 0), 0, 0, 0, this.settings, deltaSec);
      this.sceneCtx.updateDayNight(0.72); // golden hour aesthetic
      return;
    }

    if (this.phase === 'paused') {
      return;
    }

    // 3. In-game Clock update
    this.clock.update(deltaSec * 1000);
    const normDayTime = this.clock.getNormalizedDayTime();
    this.sceneCtx.updateDayNight(normDayTime);

    // 4. Input & Player update
    const actions = this.inputManager.getActions();
    const mouseDelta = this.inputManager.consumeMouseDelta();
    const wheelDelta = this.inputManager.consumeWheelDelta();

    const moveResult = this.playerController.update(
      actions,
      deltaSec,
      () => this.audio.playFootstep()
    );

    // Track total meters moved for first tutorial objective
    if (moveResult.movedMeters > 0) {
      this.totalMetersMoved += moveResult.movedMeters;
      if (this.totalMetersMoved >= 10 && this.objectives.getState().currentId === 'explore_controls') {
        this.objectives.advance('explore_controls', this.economy);
      }
    }

    // Extra energy decay while sprinting
    if (moveResult.isSprinting) {
      // 1 real second = 2 in-game mins = 1/30 in-game hour
      const inGameHours = (deltaSec * 2) / 60;
      this.needs.decay(inGameHours, true, false);
    }

    // 5. Camera update
    this.cameraRig.update(
      this.playerController.position,
      mouseDelta.dx,
      mouseDelta.dy,
      wheelDelta,
      this.settings,
      deltaSec
    );

    // 6. Interaction distance checks
    const prompt = this.interactionSystem.findActivePrompt(
      this.playerController.position,
      this.playerController.currentZone
    );

    if (prompt) {
      this.currentPrompt = {
        id: prompt.interactable.id,
        label: prompt.interactable.label,
        verb: prompt.interactable.verb,
        distance: prompt.distance,
        disabledReason: prompt.disabledReason,
      };
    } else {
      this.currentPrompt = null;
    }

    // Throttled UI state notifications
    this.notifyStateChanged();
  }

  // Subscription interface for React store
  public subscribe(cb: () => void): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  private lastNotifyTime = 0;
  public notifyStateChanged(force: boolean = false): void {
    const now = performance.now();
    // Throttle React renders to ~12 Hz to protect 3D loop performance unless forced
    if (!force && now - this.lastNotifyTime < 80) return;
    this.lastNotifyTime = now;
    this.updateCachedSnapshot();
    for (const sub of this.subscribers) {
      sub();
    }
  }

  private updateCachedSnapshot(): void {
    const timeFormatted = this.clock.getFormattedTime();
    const curTime = this.clock.getTime();
    const currentObj = this.objectives.getCurrentObjective();
    const currentZone = this.playerController?.currentZone || 'exterior';
    const zoneDef = LOCATIONS[currentZone];

    this.cachedSnapshot = {
      phase: this.phase,
      moneyCents: this.economy.getMoneyCents(),
      formattedMoney: this.economy.getFormattedMoney(),
      timeString: timeFormatted.timeString,
      dayString: timeFormatted.dayString,
      period: timeFormatted.period,
      needs: this.needs.getNeeds(),
      currentObjective: currentObj,
      prompt: this.currentPrompt,
      currentZone,
      zoneName: zoneDef?.name || 'Dunmore Square',
      rentDaysRemaining: Math.max(0, Math.ceil(this.rent.getHoursUntilDue(curTime.day, curTime.hour) / 24)),
      rentTotalDueCents: this.rent.getTotalDueCents(),
      rentIsLate: this.rent.getRentState().isLate,
      activeShopCategory: this.activeShopCategory,
      activeModal: this.activeModal,
      dialogueContent: this.dialogueContent,
      shiftSummary: this.lastShiftSummary,
      fps: this.fpsCounter,
    };
  }

  public getSnapshot(): GameSnapshot {
    if (!this.cachedSnapshot) {
      this.updateCachedSnapshot();
    }
    return this.cachedSnapshot!;
  }

  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  public dispose(): void {
    this.isDestroyed = true;
    this.saveGame();
    this.inputManager.dispose();
    this.sceneCtx.dispose();
    this.subscribers.clear();
  }
}
