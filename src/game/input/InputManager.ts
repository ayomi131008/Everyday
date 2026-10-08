export interface InputActions {
  moveForward: number; // -1 to 1
  moveRight: number;   // -1 to 1
  sprint: boolean;
  interact: boolean;
  inventory: boolean;
  pause: boolean;
}

export class InputManager {
  private keysDown: Set<string> = new Set();
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;
  private mouseWheelDelta: number = 0;
  private isPointerLocked: boolean = false;

  // Touch & Virtual controls state
  private virtualMoveForward: number = 0;
  private virtualMoveRight: number = 0;
  private virtualSprint: boolean = false;

  // Touch camera look tracking
  private activeTouchLookId: number | null = null;
  private lastTouchX: number = 0;
  private lastTouchY: number = 0;
  private initialPinchDist: number | null = null;

  private onInteractCallback?: () => void;
  private onInventoryCallback?: () => void;
  private onPauseCallback?: () => void;

  private handleKeyDownBound: (e: KeyboardEvent) => void;
  private handleKeyUpBound: (e: KeyboardEvent) => void;
  private handleMouseMoveBound: (e: MouseEvent) => void;
  private handleWheelBound: (e: WheelEvent) => void;
  private handlePointerLockChangeBound: () => void;

  private handleTouchStartBound: (e: TouchEvent) => void;
  private handleTouchMoveBound: (e: TouchEvent) => void;
  private handleTouchEndBound: (e: TouchEvent) => void;

  constructor(private canvasElement: HTMLCanvasElement) {
    this.handleKeyDownBound = this.handleKeyDown.bind(this);
    this.handleKeyUpBound = this.handleKeyUp.bind(this);
    this.handleMouseMoveBound = this.handleMouseMove.bind(this);
    this.handleWheelBound = this.handleWheel.bind(this);
    this.handlePointerLockChangeBound = this.handlePointerLockChange.bind(this);

    this.handleTouchStartBound = this.handleTouchStart.bind(this);
    this.handleTouchMoveBound = this.handleTouchMove.bind(this);
    this.handleTouchEndBound = this.handleTouchEnd.bind(this);

    window.addEventListener('keydown', this.handleKeyDownBound);
    window.addEventListener('keyup', this.handleKeyUpBound);
    document.addEventListener('pointerlockchange', this.handlePointerLockChangeBound);
    window.addEventListener('wheel', this.handleWheelBound, { passive: false });

    // Touch listeners on canvas for camera look and pinch-zoom
    this.canvasElement.addEventListener('touchstart', this.handleTouchStartBound, { passive: false });
    window.addEventListener('touchmove', this.handleTouchMoveBound, { passive: false });
    window.addEventListener('touchend', this.handleTouchEndBound, { passive: false });
    window.addEventListener('touchcancel', this.handleTouchEndBound, { passive: false });
  }

  static isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }

  requestPointerLock(): void {
    // On touch devices, skip pointer lock to prevent mobile browser errors
    if (InputManager.isTouchDevice()) return;

    if (!this.isPointerLocked && document.pointerLockElement !== this.canvasElement) {
      try {
        this.canvasElement.requestPointerLock();
      } catch (e) {
        // pointer lock request failed or denied
      }
    }
  }

  exitPointerLock(): void {
    if (document.pointerLockElement) {
      try {
        document.exitPointerLock();
      } catch (e) {
        // ignore
      }
    }
    this.isPointerLocked = false;
  }

  isLocked(): boolean {
    return this.isPointerLocked;
  }

  onInteract(cb: () => void): void {
    this.onInteractCallback = cb;
  }

  onInventory(cb: () => void): void {
    this.onInventoryCallback = cb;
  }

  onPause(cb: () => void): void {
    this.onPauseCallback = cb;
  }

  // Virtual control inputs from touchscreen UI
  setVirtualMove(forward: number, right: number): void {
    this.virtualMoveForward = Math.max(-1, Math.min(1, forward));
    this.virtualMoveRight = Math.max(-1, Math.min(1, right));
  }

  setVirtualSprint(sprint: boolean): void {
    this.virtualSprint = sprint;
  }

  addTouchLookDelta(dx: number, dy: number): void {
    this.mouseDeltaX += dx;
    this.mouseDeltaY += dy;
  }

  triggerInteract(): void {
    this.onInteractCallback?.();
  }

  triggerInventory(): void {
    this.onInventoryCallback?.();
  }

  triggerPause(): void {
    this.onPauseCallback?.();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keysDown.add(e.code);

    if (e.code === 'KeyE') {
      this.onInteractCallback?.();
    } else if (e.code === 'Tab' || e.code === 'KeyI') {
      e.preventDefault();
      this.onInventoryCallback?.();
    } else if (e.code === 'Escape') {
      this.onPauseCallback?.();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.code);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.isPointerLocked) {
      this.mouseDeltaX += e.movementX;
      this.mouseDeltaY += e.movementY;
    }
  }

  private handleWheel(e: WheelEvent): void {
    this.mouseWheelDelta += Math.sign(e.deltaY);
  }

  private handlePointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.canvasElement;
    if (this.isPointerLocked) {
      document.addEventListener('mousemove', this.handleMouseMoveBound);
    } else {
      document.removeEventListener('mousemove', this.handleMouseMoveBound);
    }
  }

  // Touch Camera drag & Pinch-to-zoom
  private handleTouchStart(e: TouchEvent): void {
    // If user touched with two fingers on canvas -> pinch zoom
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      this.initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      return;
    }

    // Touch look tracking: pick touch on right 65% of screen or upper half
    if (this.activeTouchLookId === null) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        // Allow drag on canvas if not touching the virtual joystick on bottom-left
        const isJoystickArea = touch.clientX < window.innerWidth * 0.4 && touch.clientY > window.innerHeight * 0.55;
        if (!isJoystickArea) {
          this.activeTouchLookId = touch.identifier;
          this.lastTouchX = touch.clientX;
          this.lastTouchY = touch.clientY;
          break;
        }
      }
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    // Handle pinch zoom
    if (e.touches.length === 2 && this.initialPinchDist !== null) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const pinchDelta = (this.initialPinchDist - currentDist) * 0.05;
      this.mouseWheelDelta += Math.sign(pinchDelta);
      this.initialPinchDist = currentDist;
      return;
    }

    // Handle single finger camera rotation
    if (this.activeTouchLookId !== null) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.activeTouchLookId) {
          e.preventDefault();
          const dx = (touch.clientX - this.lastTouchX) * 1.5;
          const dy = (touch.clientY - this.lastTouchY) * 1.5;
          this.mouseDeltaX += dx;
          this.mouseDeltaY += dy;
          this.lastTouchX = touch.clientX;
          this.lastTouchY = touch.clientY;
          break;
        }
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (e.touches.length < 2) {
      this.initialPinchDist = null;
    }

    if (this.activeTouchLookId !== null) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.activeTouchLookId) {
          this.activeTouchLookId = null;
          break;
        }
      }
    }
  }

  getActions(): InputActions {
    let forward = this.virtualMoveForward;
    let right = this.virtualMoveRight;

    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) forward += 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) forward -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) right += 1;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) right -= 1;

    // Clamp combined inputs
    forward = Math.max(-1, Math.min(1, forward));
    right = Math.max(-1, Math.min(1, right));

    const sprint = this.virtualSprint || this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight');

    return {
      moveForward: forward,
      moveRight: right,
      sprint,
      interact: this.keysDown.has('KeyE'),
      inventory: this.keysDown.has('Tab') || this.keysDown.has('KeyI'),
      pause: this.keysDown.has('Escape'),
    };
  }

  consumeMouseDelta(): { dx: number; dy: number } {
    const dx = this.mouseDeltaX;
    const dy = this.mouseDeltaY;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return { dx, dy };
  }

  consumeWheelDelta(): number {
    const delta = this.mouseWheelDelta;
    this.mouseWheelDelta = 0;
    return delta;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDownBound);
    window.removeEventListener('keyup', this.handleKeyUpBound);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChangeBound);
    document.removeEventListener('mousemove', this.handleMouseMoveBound);
    window.removeEventListener('wheel', this.handleWheelBound);

    this.canvasElement.removeEventListener('touchstart', this.handleTouchStartBound);
    window.removeEventListener('touchmove', this.handleTouchMoveBound);
    window.removeEventListener('touchend', this.handleTouchEndBound);
    window.removeEventListener('touchcancel', this.handleTouchEndBound);
  }
}
