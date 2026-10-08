import { Scene, Vector3 } from '@babylonjs/core';
import { BALANCE } from '../config/balance';
import { NeedsSystem } from '../sim/Needs';
import { CollisionSystem } from '../world/Colliders';
import { CameraRig } from './CameraRig';
import { CharacterRig } from './CharacterModel';
import { InputActions } from '../input/InputManager';

export class PlayerController {
  public position: Vector3;
  public rotationY: number = 0;
  public currentZone: 'exterior' | 'apartment' | 'diner' | 'convenience' = 'exterior';

  private currentSpeed: number = 0;
  private isSprinting: boolean = false;
  private lastSafePosition: Vector3;

  constructor(
    public characterRig: CharacterRig,
    public cameraRig: CameraRig,
    private collisionSystem: CollisionSystem,
    private needsSystem: NeedsSystem,
    initialPos: { x: number; y: number; z: number } = { x: 0, y: 0.9, z: -10 }
  ) {
    this.position = new Vector3(initialPos.x, initialPos.y, initialPos.z);
    this.lastSafePosition = this.position.clone();
    this.characterRig.root.position.copyFrom(this.position);
  }

  teleport(pos: { x: number; y: number; z: number }, zone: 'exterior' | 'apartment' | 'diner' | 'convenience'): void {
    this.position.set(pos.x, pos.y, pos.z);
    this.lastSafePosition.copyFrom(this.position);
    this.currentZone = zone;
    this.characterRig.root.position.copyFrom(this.position);

    // Adjust camera distance depending on interior/exterior
    if (zone === 'exterior') {
      this.cameraRig.setTargetDistance(6.5);
    } else {
      this.cameraRig.setTargetDistance(4.5);
    }
  }

  update(
    input: InputActions,
    deltaSec: number,
    onFootstep?: () => void
  ): { isSprinting: boolean; movedMeters: number } {
    // Failsafe for NaN
    if (!Number.isFinite(this.position.x) || !Number.isFinite(this.position.z) || this.position.y < -3) {
      this.position.copyFrom(this.lastSafePosition);
    }

    const needs = this.needsSystem.getNeeds();

    // Determine target speed
    let baseSpeed: number = BALANCE.MOVEMENT.WALK_SPEED;
    const canSprint = input.sprint && needs.energy > 8;
    this.isSprinting = canSprint && (input.moveForward !== 0 || input.moveRight !== 0);

    if (this.isSprinting) {
      baseSpeed = BALANCE.MOVEMENT.SPRINT_SPEED;
    }

    // Hunger penalty
    if (needs.hunger <= 0) {
      baseSpeed *= BALANCE.MOVEMENT.LOW_HUNGER_SPEED_PENALTY;
    }

    // Camera-relative direction calculation
    // Camera alpha is the yaw around Y
    const camYaw = this.cameraRig.getYaw();
    // In Babylon ArcRotateCamera: alpha=0 looks toward +X, forward along Z is -cos, etc.
    // Forward vector relative to camera look
    const forwardX = -Math.cos(camYaw);
    const forwardZ = -Math.sin(camYaw);
    const rightX = -Math.sin(camYaw);
    const rightZ = Math.cos(camYaw);

    let moveX = 0;
    let moveZ = 0;

    if (input.moveForward !== 0 || input.moveRight !== 0) {
      // Normalize input vector
      const mag = Math.hypot(input.moveForward, input.moveRight);
      const inputFwd = input.moveForward / mag;
      const inputRgt = input.moveRight / mag;

      moveX = forwardX * inputFwd + rightX * inputRgt;
      moveZ = forwardZ * inputFwd + rightZ * inputRgt;
    }

    const hasInput = Math.hypot(moveX, moveZ) > 0.05;

    // Smooth acceleration / deceleration
    const targetSpeed = hasInput ? baseSpeed : 0;
    this.currentSpeed += (targetSpeed - this.currentSpeed) * Math.min(1, deltaSec * 14);

    let movedDistance = 0;

    if (this.currentSpeed > 0.05 && hasInput) {
      const step = this.currentSpeed * deltaSec;
      const dx = moveX * step;
      const dz = moveZ * step;

      // Sliding collision resolution
      const resolved = this.collisionSystem.resolveMovement(
        this.position.x,
        this.position.z,
        dx,
        dz,
        0.35, // player radius
        this.currentZone
      );

      const actualDx = resolved.x - this.position.x;
      const actualDz = resolved.z - this.position.z;
      movedDistance = Math.hypot(actualDx, actualDz);

      this.position.x = resolved.x;
      this.position.z = resolved.z;
      this.lastSafePosition.copyFrom(this.position);

      // Smooth rotate towards movement direction
      const desiredYaw = Math.atan2(moveX, moveZ);
      let diff = desiredYaw - this.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotationY += diff * Math.min(1, deltaSec * 16);
    }

    // Apply to mesh
    this.characterRig.root.position.copyFrom(this.position);
    this.characterRig.root.rotation.y = this.rotationY;

    // Animate procedural mesh
    const speedRatio = this.currentSpeed / BALANCE.MOVEMENT.SPRINT_SPEED;
    const animResult = this.characterRig.animate(speedRatio, this.isSprinting, deltaSec);

    if (animResult.footstepTriggered && onFootstep) {
      onFootstep();
    }

    return {
      isSprinting: this.isSprinting,
      movedMeters: movedDistance,
    };
  }
}
