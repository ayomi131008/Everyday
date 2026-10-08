export interface BoxCollider {
  type: 'box';
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  zone: 'exterior' | 'apartment' | 'diner' | 'convenience';
}

export interface CircleCollider {
  type: 'circle';
  x: number;
  z: number;
  radius: number;
  zone: 'exterior' | 'apartment' | 'diner' | 'convenience';
}

export type Collider = BoxCollider | CircleCollider;

export class CollisionSystem {
  private colliders: Collider[] = [];

  clear(): void {
    this.colliders = [];
  }

  addBox(minX: number, maxX: number, minZ: number, maxZ: number, zone: Collider['zone'] = 'exterior'): void {
    this.colliders.push({
      type: 'box',
      minX: Math.min(minX, maxX),
      maxX: Math.max(minX, maxX),
      minZ: Math.min(minZ, maxZ),
      maxZ: Math.max(minZ, maxZ),
      zone,
    });
  }

  addCircle(x: number, z: number, radius: number, zone: Collider['zone'] = 'exterior'): void {
    this.colliders.push({
      type: 'circle',
      x,
      z,
      radius,
      zone,
    });
  }

  // Sliding circle collision against boxes and circles
  resolveMovement(
    curX: number,
    curZ: number,
    dx: number,
    dz: number,
    playerRadius: number,
    currentZone: Collider['zone']
  ): { x: number; z: number } {
    if (!Number.isFinite(curX) || !Number.isFinite(curZ) || !Number.isFinite(dx) || !Number.isFinite(dz)) {
      return { x: 0, z: -10 };
    }

    const zoneColliders = this.colliders.filter((c) => c.zone === currentZone);

    // Try moving along X first (sliding along Z walls)
    let newX = curX + dx;
    for (const c of zoneColliders) {
      if (this.checkCollision(newX, curZ, playerRadius, c)) {
        newX = curX; // cancel X move
        break;
      }
    }

    // Try moving along Z (sliding along X walls)
    let newZ = curZ + dz;
    for (const c of zoneColliders) {
      if (this.checkCollision(newX, newZ, playerRadius, c)) {
        newZ = curZ; // cancel Z move
        break;
      }
    }

    // Final boundary safeguard per zone
    const clamped = this.clampToBounds(newX, newZ, currentZone);
    return clamped;
  }

  private checkCollision(px: number, pz: number, r: number, collider: Collider): boolean {
    if (collider.type === 'box') {
      const closestX = Math.max(collider.minX, Math.min(px, collider.maxX));
      const closestZ = Math.max(collider.minZ, Math.min(pz, collider.maxZ));
      const distX = px - closestX;
      const distZ = pz - closestZ;
      return distX * distX + distZ * distZ < r * r;
    } else {
      const distX = px - collider.x;
      const distZ = pz - collider.z;
      const minDist = r + collider.radius;
      return distX * distX + distZ * distZ < minDist * minDist;
    }
  }

  private clampToBounds(x: number, z: number, zone: Collider['zone']): { x: number; z: number } {
    switch (zone) {
      case 'exterior':
        return {
          x: Math.max(-48, Math.min(48, x)),
          z: Math.max(-48, Math.min(48, z)),
        };
      case 'apartment':
        return {
          x: Math.max(93, Math.min(107, x)),
          z: Math.max(-7, Math.min(7, z)),
        };
      case 'diner':
        return {
          x: Math.max(191, Math.min(209, x)),
          z: Math.max(-9, Math.min(9, z)),
        };
      case 'convenience':
        return {
          x: Math.max(292, Math.min(308, x)),
          z: Math.max(-8, Math.min(8, z)),
        };
    }
  }
}
