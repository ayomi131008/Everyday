import { ArcRotateCamera, Ray, Scene, Vector3 } from '@babylonjs/core';
import { GameSettings } from '../core/Types';

export class CameraRig {
  public camera: ArcRotateCamera;
  private targetPosition: Vector3 = new Vector3(0, 1.2, 0);
  private targetDistance: number = 6.0;
  private currentDistance: number = 6.0;
  private minDistance: number = 2.2;
  private maxDistance: number = 10.0;

  // Smoothing
  private smoothingAlpha: number = 0.15;
  private orbitMode: boolean = false;
  private orbitAngle: number = 0;

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.camera = new ArcRotateCamera(
      'playerFollowCamera',
      -Math.PI / 2, // alpha (yaw)
      Math.PI / 3,  // beta (pitch)
      this.currentDistance,
      this.targetPosition,
      scene
    );

    this.camera.lowerBetaLimit = 0.25; // don't look completely straight down or straight up
    this.camera.upperBetaLimit = Math.PI / 2.05; // don't go under floor
    this.camera.wheelPrecision = 40;
    this.camera.fov = 0.95;
    this.camera.minZ = 0.2;
    this.camera.maxZ = 250;
    this.camera.inputs.clear(); // We manage input manually for tight responsiveness
  }

  setOrbitMode(orbit: boolean): void {
    this.orbitMode = orbit;
    if (orbit) {
      this.targetDistance = 14.0;
      this.currentDistance = 14.0;
      this.camera.beta = Math.PI / 3.4;
      this.camera.target = new Vector3(0, 2, 0);
    }
  }

  setTargetDistance(dist: number): void {
    this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, dist));
  }

  update(
    playerPos: Vector3,
    mouseDeltaX: number,
    mouseDeltaY: number,
    wheelDelta: number,
    settings: GameSettings,
    deltaSec: number
  ): void {
    if (this.orbitMode) {
      this.orbitAngle += deltaSec * 0.15;
      this.camera.alpha = this.orbitAngle;
      this.camera.radius = 16;
      this.camera.target = new Vector3(0, 3, 0);
      return;
    }

    // Apply mouse look
    const sens = (settings.mouseSensitivity || 1.0) * 0.003;
    const invertY = settings.invertY ? -1 : 1;

    this.camera.alpha += mouseDeltaX * sens;
    this.camera.beta = Math.max(
      this.camera.lowerBetaLimit || 0.25,
      Math.min(this.camera.upperBetaLimit || 1.5, this.camera.beta + mouseDeltaY * sens * invertY)
    );

    // Apply zoom
    if (wheelDelta !== 0) {
      this.targetDistance = Math.max(
        this.minDistance,
        Math.min(this.maxDistance, this.targetDistance + wheelDelta * 0.6)
      );
    }

    // Smooth camera distance
    this.currentDistance += (this.targetDistance - this.currentDistance) * 0.2;
    this.camera.radius = this.currentDistance;

    // Follow target smoothly
    const lookHeight = 1.35;
    const targetY = playerPos.y + lookHeight;

    this.targetPosition.x += (playerPos.x - this.targetPosition.x) * this.smoothingAlpha;
    this.targetPosition.y += (targetY - this.targetPosition.y) * this.smoothingAlpha;
    this.targetPosition.z += (playerPos.z - this.targetPosition.z) * this.smoothingAlpha;

    this.camera.target.copyFrom(this.targetPosition);
  }

  getYaw(): number {
    return this.camera.alpha;
  }
}
