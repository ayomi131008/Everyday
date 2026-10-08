import {
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import { MaterialLibrary } from '../render/Materials';

export interface CharacterRig {
  root: TransformNode;
  torso: Mesh;
  head: Mesh;
  armLeft: Mesh;
  armRight: Mesh;
  legLeft: Mesh;
  legRight: Mesh;
  animate: (speedRatio: number, isSprinting: boolean, deltaSec: number) => { footstepTriggered: boolean };
  dispose: () => void;
}

export function createProceduralCharacter(
  scene: Scene,
  materials: MaterialLibrary,
  namePrefix: string = 'player',
  customShirtMat?: StandardMaterial
): CharacterRig {
  const root = new TransformNode(`${namePrefix}_rig`, scene);

  // Torso
  const torso = MeshBuilder.CreateBox(`${namePrefix}_torso`, { width: 0.65, height: 0.75, depth: 0.35 }, scene);
  torso.material = customShirtMat || materials.clothShirt;
  torso.position.y = 1.05;
  torso.parent = root;

  // Head
  const head = MeshBuilder.CreateBox(`${namePrefix}_head`, { width: 0.42, height: 0.45, depth: 0.42 }, scene);
  head.material = materials.skinTone;
  head.position.y = 1.62;
  head.parent = root;

  // Hair / Cap
  const hair = MeshBuilder.CreateBox(`${namePrefix}_hair`, { width: 0.46, height: 0.22, depth: 0.46 }, scene);
  hair.material = materials.hairBrown;
  hair.position.y = 1.82;
  hair.parent = root;

  // Duffel bag strap / Satchel on shoulder (charming detail!)
  const strap = MeshBuilder.CreateBox(`${namePrefix}_strap`, { width: 0.68, height: 0.1, depth: 0.38 }, scene);
  strap.material = materials.barkBrown;
  strap.position.y = 1.1;
  strap.rotation.z = 0.35;
  strap.parent = root;

  // Arms (Pivots at shoulder)
  const armLeft = MeshBuilder.CreateBox(`${namePrefix}_armL`, { width: 0.18, height: 0.65, depth: 0.18 }, scene);
  armLeft.material = customShirtMat || materials.clothShirt;
  armLeft.position.set(-0.46, 0.95, 0);
  armLeft.setPivotPoint(new Vector3(0, 0.3, 0));
  armLeft.parent = root;

  const armRight = MeshBuilder.CreateBox(`${namePrefix}_armR`, { width: 0.18, height: 0.65, depth: 0.18 }, scene);
  armRight.material = customShirtMat || materials.clothShirt;
  armRight.position.set(0.46, 0.95, 0);
  armRight.setPivotPoint(new Vector3(0, 0.3, 0));
  armRight.parent = root;

  // Legs (Pivots at hips)
  const legLeft = MeshBuilder.CreateBox(`${namePrefix}_legL`, { width: 0.22, height: 0.72, depth: 0.22 }, scene);
  legLeft.material = materials.clothDenim;
  legLeft.position.set(-0.18, 0.38, 0);
  legLeft.setPivotPoint(new Vector3(0, 0.36, 0));
  legLeft.parent = root;

  const legRight = MeshBuilder.CreateBox(`${namePrefix}_legR`, { width: 0.22, height: 0.72, depth: 0.22 }, scene);
  legRight.material = materials.clothDenim;
  legRight.position.set(0.18, 0.38, 0);
  legRight.setPivotPoint(new Vector3(0, 0.36, 0));
  legRight.parent = root;

  let animTime = 0;
  let lastCycle = 0;

  const animate = (speedRatio: number, isSprinting: boolean, deltaSec: number): { footstepTriggered: boolean } => {
    let footstepTriggered = false;

    if (speedRatio > 0.05) {
      const freq = isSprinting ? 12 : 8;
      animTime += deltaSec * freq;

      const swingAngle = Math.sin(animTime) * (isSprinting ? 0.75 : 0.5);

      legLeft.rotation.x = swingAngle;
      legRight.rotation.x = -swingAngle;
      armLeft.rotation.x = -swingAngle * 0.9;
      armRight.rotation.x = swingAngle * 0.9;

      // Torso bobbing
      torso.position.y = 1.05 + Math.abs(Math.sin(animTime)) * 0.06;
      head.position.y = 1.62 + Math.abs(Math.sin(animTime)) * 0.06;

      // Check foot impact triggers
      const currentCycle = Math.floor(animTime / Math.PI);
      if (currentCycle > lastCycle) {
        lastCycle = currentCycle;
        footstepTriggered = true;
      }
    } else {
      // Idle breathing
      animTime += deltaSec * 2;
      const breath = Math.sin(animTime) * 0.02;

      legLeft.rotation.x = 0;
      legRight.rotation.x = 0;
      armLeft.rotation.x = 0;
      armRight.rotation.x = 0;

      torso.position.y = 1.05 + breath;
      head.position.y = 1.62 + breath * 0.5;
    }

    return { footstepTriggered };
  };

  return {
    root,
    torso,
    head,
    armLeft,
    armRight,
    legLeft,
    legRight,
    animate,
    dispose: () => {
      root.dispose();
    },
  };
}
