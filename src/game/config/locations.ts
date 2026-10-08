import { Vector3D } from '../core/Types';

export interface LocationZoneDef {
  id: string;
  name: string;
  address: string;
  openHour?: number;
  closeHour?: number;
  alwaysOpen?: boolean;
  spawnPosition: Vector3D;
  cameraPitch?: number;
  cameraDistance?: number;
}

export const LOCATIONS: Record<string, LocationZoneDef> = {
  exterior: {
    id: 'exterior',
    name: 'Dunmore Square',
    address: 'Corner of Dunmore Ave & Pell St',
    alwaysOpen: true,
    spawnPosition: { x: 0, y: 0.9, z: -10 },
    cameraDistance: 6.5,
  },
  apartment: {
    id: 'apartment',
    name: 'Lindqvist Arms - Room 2B',
    address: '14 Pell Street',
    alwaysOpen: true,
    spawnPosition: { x: 100, y: 0.9, z: 0 },
    cameraDistance: 4.5,
  },
  diner: {
    id: 'diner',
    name: "Mel's Diner Interior",
    address: '88 Dunmore Avenue',
    openHour: 6,
    closeHour: 21,
    spawnPosition: { x: 200, y: 0.9, z: 0 },
    cameraDistance: 5.0,
  },
  convenience: {
    id: 'convenience',
    name: 'QuikStop Corner Market',
    address: '102 Dunmore Avenue',
    openHour: 6,
    closeHour: 23,
    spawnPosition: { x: 300, y: 0.9, z: 0 },
    cameraDistance: 4.8,
  },
};
