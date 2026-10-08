import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import { MaterialLibrary } from '../render/Materials';
import { CollisionSystem } from './Colliders';

export interface WorldContext {
  rootNode: TransformNode;
  collisionSystem: CollisionSystem;
  doorMarkers: Record<string, Vector3>;
  dispose: () => void;
}

export function buildDunmoreSquare(
  scene: Scene,
  materials: MaterialLibrary,
  collisionSystem: CollisionSystem
): WorldContext {
  const rootNode = new TransformNode('worldRoot', scene);

  // Clear previous colliders
  collisionSystem.clear();

  const doorMarkers: Record<string, Vector3> = {
    aptExteriorDoor: new Vector3(16, 0.9, -8),
    aptInteriorDoor: new Vector3(95, 0.9, 0),
    dinerExteriorDoor: new Vector3(-16, 0.9, 8),
    dinerInteriorDoor: new Vector3(193, 0.9, 0),
    storeExteriorDoor: new Vector3(-16, 0.9, -14),
    storeInteriorDoor: new Vector3(294, 0.9, 0),
  };

  // Helper to attach to root and freeze static matrices
  const registerMesh = (mesh: Mesh, shadowCast: boolean = true) => {
    mesh.parent = rootNode;
    mesh.isPickable = false;
    mesh.freezeWorldMatrix();
    mesh.doNotSyncBoundingInfo = true;
    return mesh;
  };

  // ==========================================
  // 1. EXTERIOR GROUND & ROADS
  // ==========================================
  // Main grass foundation
  const ground = MeshBuilder.CreateGround('ground', { width: 110, height: 110 }, scene);
  ground.material = materials.grass;
  ground.position.y = -0.05;
  registerMesh(ground, false);

  // Road: Dunmore Ave (East-West)
  const roadEastWest = MeshBuilder.CreateGround('roadEW', { width: 96, height: 10 }, scene);
  roadEastWest.material = materials.asphalt;
  roadEastWest.position.set(0, 0, 0);
  registerMesh(roadEastWest, false);

  // Road: Pell St (North-South)
  const roadNorthSouth = MeshBuilder.CreateGround('roadNS', { width: 10, height: 96 }, scene);
  roadNorthSouth.material = materials.asphalt;
  roadNorthSouth.position.set(0, 0.01, 0);
  registerMesh(roadNorthSouth, false);

  // Sidewalks (North-East, North-West, South-East, South-West)
  const makeSidewalk = (name: string, x: number, z: number, w: number, h: number) => {
    const sw = MeshBuilder.CreateBox(name, { width: w, height: 0.25, depth: h }, scene);
    sw.material = materials.sidewalk;
    sw.position.set(x, 0.12, z);
    registerMesh(sw, false);
    return sw;
  };

  makeSidewalk('swNE', 26, 26, 42, 42);
  makeSidewalk('swNW', -26, 26, 42, 42);
  makeSidewalk('swSE', 26, -26, 42, 42);
  makeSidewalk('swSW', -26, -26, 42, 42);

  // Crosswalk stripes
  for (let i = -3.5; i <= 3.5; i += 1.4) {
    const cw1 = MeshBuilder.CreateGround(`cw1_${i}`, { width: 0.7, height: 4 }, scene);
    cw1.material = materials.crosswalkWhite;
    cw1.position.set(i, 0.03, 6.5);
    registerMesh(cw1, false);

    const cw2 = MeshBuilder.CreateGround(`cw2_${i}`, { width: 0.7, height: 4 }, scene);
    cw2.material = materials.crosswalkWhite;
    cw2.position.set(i, 0.03, -6.5);
    registerMesh(cw2, false);

    const cw3 = MeshBuilder.CreateGround(`cw3_${i}`, { width: 4, height: 0.7 }, scene);
    cw3.material = materials.crosswalkWhite;
    cw3.position.set(6.5, 0.03, i);
    registerMesh(cw3, false);

    const cw4 = MeshBuilder.CreateGround(`cw4_${i}`, { width: 4, height: 0.7 }, scene);
    cw4.material = materials.crosswalkWhite;
    cw4.position.set(-6.5, 0.03, i);
    registerMesh(cw4, false);
  }

  // ==========================================
  // 2. EXTERIOR BUILDINGS & COLLIDERS
  // ==========================================

  // Building 1: Lindqvist Arms (Apartment Building) at (20, -18)
  const aptBlock = MeshBuilder.CreateBox('aptBlock', { width: 18, height: 14, depth: 16 }, scene);
  aptBlock.material = materials.brickRed;
  aptBlock.position.set(20, 7, -18);
  registerMesh(aptBlock);
  collisionSystem.addBox(11, 29, -26, -10, 'exterior');

  // Lindqvist roof trim
  const aptTrim = MeshBuilder.CreateBox('aptTrim', { width: 18.6, height: 0.8, depth: 16.6 }, scene);
  aptTrim.material = materials.roofDark;
  aptTrim.position.set(20, 14.2, -18);
  registerMesh(aptTrim);

  // Lindqvist stoop & door
  const aptDoor = MeshBuilder.CreateBox('aptDoor', { width: 2.2, height: 3.2, depth: 0.3 }, scene);
  aptDoor.material = materials.doorWood;
  aptDoor.position.set(16, 1.6, -9.9);
  registerMesh(aptDoor);

  // Building 2: Mel's Diner at (-20, 18)
  const dinerBlock = MeshBuilder.CreateBox('dinerBlock', { width: 20, height: 7.5, depth: 14 }, scene);
  dinerBlock.material = materials.dinerMint;
  dinerBlock.position.set(-20, 3.75, 18);
  registerMesh(dinerBlock);
  collisionSystem.addBox(-30, -10, 11, 25, 'exterior');

  // Diner facade stripe & neon band
  const dinerStripe = MeshBuilder.CreateBox('dinerStripe', { width: 20.3, height: 1.2, depth: 14.3 }, scene);
  dinerStripe.material = materials.dinerCream;
  dinerStripe.position.set(-20, 5.5, 18);
  registerMesh(dinerStripe);

  const dinerNeon = MeshBuilder.CreateBox('dinerNeon', { width: 8, height: 1.4, depth: 0.4 }, scene);
  dinerNeon.material = materials.neonCyan;
  dinerNeon.position.set(-16, 6.2, 10.8);
  registerMesh(dinerNeon);

  // Diner Door
  const dinerDoor = MeshBuilder.CreateBox('dinerDoor', { width: 2.4, height: 3.2, depth: 0.3 }, scene);
  dinerDoor.material = materials.doorWood;
  dinerDoor.position.set(-16, 1.6, 10.8);
  registerMesh(dinerDoor);

  // Building 3: QuikStop Corner Market at (-20, -20)
  const storeBlock = MeshBuilder.CreateBox('storeBlock', { width: 16, height: 8, depth: 14 }, scene);
  storeBlock.material = materials.storeYellow;
  storeBlock.position.set(-20, 4, -20);
  registerMesh(storeBlock);
  collisionSystem.addBox(-28, -12, -27, -13, 'exterior');

  // QuikStop sign
  const storeSign = MeshBuilder.CreateBox('storeSign', { width: 9, height: 1.5, depth: 0.4 }, scene);
  storeSign.material = materials.neonPink;
  storeSign.position.set(-16, 5.8, -12.8);
  registerMesh(storeSign);

  // QuikStop door
  const storeDoor = MeshBuilder.CreateBox('storeDoor', { width: 2.2, height: 3.2, depth: 0.3 }, scene);
  storeDoor.material = materials.doorWood;
  storeDoor.position.set(-16, 1.6, -12.8);
  registerMesh(storeDoor);

  // Zone 4: Dunmore Park at (24, 24)
  // Cobblestone park court
  const parkCourt = MeshBuilder.CreateBox('parkCourt', { width: 20, height: 0.3, depth: 20 }, scene);
  parkCourt.material = materials.curb;
  parkCourt.position.set(24, 0.16, 24);
  registerMesh(parkCourt, false);

  // Basketball pole & backboard
  const hoopPole = MeshBuilder.CreateCylinder('hoopPole', { height: 4.5, diameter: 0.2 }, scene);
  hoopPole.material = materials.metalDark;
  hoopPole.position.set(24, 2.25, 30);
  registerMesh(hoopPole);
  collisionSystem.addCircle(24, 30, 0.6, 'exterior');

  const hoopBoard = MeshBuilder.CreateBox('hoopBoard', { width: 2.2, height: 1.5, depth: 0.1 }, scene);
  hoopBoard.material = materials.crosswalkWhite;
  hoopBoard.position.set(24, 4.0, 29.8);
  registerMesh(hoopBoard);

  const hoopRim = MeshBuilder.CreateTorus('hoopRim', { diameter: 0.8, thickness: 0.08 }, scene);
  hoopRim.material = materials.hydrantRed;
  hoopRim.position.set(24, 3.4, 29.2);
  registerMesh(hoopRim);

  // Park benches
  const makeBench = (name: string, x: number, z: number, rotY: number) => {
    const bench = MeshBuilder.CreateBox(name, { width: 2.4, height: 0.8, depth: 0.9 }, scene);
    bench.material = materials.woodBench;
    bench.position.set(x, 0.5, z);
    bench.rotation.y = rotY;
    registerMesh(bench);
    collisionSystem.addBox(x - 1.2, x + 1.2, z - 0.5, z + 0.5, 'exterior');
  };

  makeBench('parkBench1', 18, 20, 0);
  makeBench('parkBench2', 30, 20, 0);

  // Surrounding facade backdrop buildings to seal the block
  const makeRowhouse = (name: string, x: number, z: number, w: number, d: number, h: number, mat: StandardMaterial) => {
    const house = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
    house.material = mat;
    house.position.set(x, h / 2, z);
    registerMesh(house);
    collisionSystem.addBox(x - w / 2, x + w / 2, z - d / 2, z + d / 2, 'exterior');
  };

  // Seal North edge
  makeRowhouse('rowN1', -20, 40, 22, 14, 12, materials.brickDark);
  makeRowhouse('rowN2', 20, 40, 22, 14, 13, materials.apartmentTan);

  // Seal South edge
  makeRowhouse('rowS1', -20, -40, 22, 14, 11, materials.brickDark);
  makeRowhouse('rowS2', 20, -40, 22, 14, 14, materials.apartmentTan);

  // Seal East & West edges
  makeRowhouse('rowE1', 40, 0, 14, 36, 11, materials.brickRed);
  makeRowhouse('rowW1', -40, 0, 14, 36, 12, materials.brickRed);

  // Streetlights
  const makeLampPost = (name: string, x: number, z: number) => {
    const pole = MeshBuilder.CreateCylinder(`${name}_pole`, { height: 5.5, diameter: 0.2 }, scene);
    pole.material = materials.metalDark;
    pole.position.set(x, 2.75, z);
    registerMesh(pole);

    const head = MeshBuilder.CreateBox(`${name}_head`, { width: 0.7, height: 0.35, depth: 1.1 }, scene);
    head.material = materials.metalDark;
    head.position.set(x, 5.5, z + (z > 0 ? -0.4 : 0.4));
    registerMesh(head);

    const bulb = MeshBuilder.CreateSphere(`${name}_bulb`, { diameter: 0.45 }, scene);
    bulb.material = materials.lampGlow;
    bulb.position.set(x, 5.3, z + (z > 0 ? -0.4 : 0.4));
    registerMesh(bulb);

    collisionSystem.addCircle(x, z, 0.4, 'exterior');
  };

  makeLampPost('lamp1', 7.5, 7.5);
  makeLampPost('lamp2', -7.5, 7.5);
  makeLampPost('lamp3', 7.5, -7.5);
  makeLampPost('lamp4', -7.5, -7.5);

  // Trees and Hedges in Park & Sidewalks
  const makeTree = (name: string, x: number, z: number, autumn: boolean = false) => {
    const trunk = MeshBuilder.CreateCylinder(`${name}_trunk`, { height: 2.2, diameter: 0.5 }, scene);
    trunk.material = materials.barkBrown;
    trunk.position.set(x, 1.1, z);
    registerMesh(trunk);

    const foliage = MeshBuilder.CreateSphere(`${name}_foliage`, { diameterX: 3.2, diameterY: 3.8, diameterZ: 3.2, segments: 4 }, scene);
    foliage.material = autumn ? materials.foliageAutumn : materials.foliageGreen;
    foliage.position.set(x, 3.4, z);
    registerMesh(foliage);

    collisionSystem.addCircle(x, z, 0.7, 'exterior');
  };

  makeTree('tree1', 16, 28, false);
  makeTree('tree2', 32, 28, true);
  makeTree('tree3', 28, 14, false);
  makeTree('tree4', 8, -14, true);
  makeTree('tree5', -8, 14, false);

  // Parked cars (2 cars on street curbs)
  const makeCar = (name: string, x: number, z: number, colorMat: StandardMaterial, rotY: number = 0) => {
    const body = MeshBuilder.CreateBox(`${name}_body`, { width: 2.2, height: 1.1, depth: 4.4 }, scene);
    body.material = colorMat;
    body.position.set(x, 0.8, z);
    body.rotation.y = rotY;
    registerMesh(body);

    const cabin = MeshBuilder.CreateBox(`${name}_cabin`, { width: 1.9, height: 0.8, depth: 2.4 }, scene);
    cabin.material = materials.windowGlass;
    cabin.position.set(x, 1.6, z - 0.2);
    cabin.rotation.y = rotY;
    registerMesh(cabin);

    collisionSystem.addBox(x - 1.2, x + 1.2, z - 2.3, z + 2.3, 'exterior');
  };

  makeCar('car1', 4, -18, materials.clothDenim);
  makeCar('car2', -4, 18, materials.brickRed);

  // Fire Hydrants & Trash Cans
  const makeHydrant = (name: string, x: number, z: number) => {
    const hydrant = MeshBuilder.CreateCylinder(name, { height: 0.8, diameter: 0.35 }, scene);
    hydrant.material = materials.hydrantRed;
    hydrant.position.set(x, 0.4, z);
    registerMesh(hydrant);
    collisionSystem.addCircle(x, z, 0.3, 'exterior');
  };

  makeHydrant('hydrant1', 6.2, 5.2);
  makeHydrant('hydrant2', -6.2, -5.2);

  // ==========================================
  // 3. INTERIOR 1: LINDQVIST ARMS (APT 2B) (Center at x=100)
  // ==========================================
  const aptFloor = MeshBuilder.CreateBox('aptInteriorFloor', { width: 14, height: 0.2, depth: 14 }, scene);
  aptFloor.material = materials.interiorFloor;
  aptFloor.position.set(100, 0, 0);
  registerMesh(aptFloor, false);

  // Apartment walls
  const makeIntWall = (name: string, x: number, z: number, w: number, d: number) => {
    const wall = MeshBuilder.CreateBox(name, { width: w, height: 4.5, depth: d }, scene);
    wall.material = materials.interiorWall;
    wall.position.set(x, 2.25, z);
    registerMesh(wall);
    return wall;
  };

  makeIntWall('aptW_N', 100, 7, 14, 0.4);
  makeIntWall('aptW_S', 100, -7, 14, 0.4);
  makeIntWall('aptW_E', 107, 0, 0.4, 14);
  makeIntWall('aptW_W', 93, 0, 0.4, 14);
  collisionSystem.addBox(92, 108, 6.8, 7.5, 'apartment');
  collisionSystem.addBox(92, 108, -7.5, -6.8, 'apartment');
  collisionSystem.addBox(106.8, 107.5, -7, 7, 'apartment');
  collisionSystem.addBox(92.5, 93.2, -7, 7, 'apartment');

  // Interior Bed at (104, 4)
  const bedFrame = MeshBuilder.CreateBox('aptBedFrame', { width: 2.8, height: 0.6, depth: 3.8 }, scene);
  bedFrame.material = materials.woodBench;
  bedFrame.position.set(104.5, 0.4, 4.5);
  registerMesh(bedFrame);

  const bedMat = MeshBuilder.CreateBox('aptBedMattress', { width: 2.6, height: 0.4, depth: 3.6 }, scene);
  bedMat.material = materials.dinerCream;
  bedMat.position.set(104.5, 0.8, 4.5);
  registerMesh(bedMat);

  const bedPillow = MeshBuilder.CreateBox('aptBedPillow', { width: 1.8, height: 0.25, depth: 0.8 }, scene);
  bedPillow.material = materials.crosswalkWhite;
  bedPillow.position.set(104.5, 1.05, 5.8);
  registerMesh(bedPillow);
  collisionSystem.addBox(103, 106, 2.5, 6.5, 'apartment');

  // Shower Stall at (96, 4.5)
  const showerBase = MeshBuilder.CreateBox('aptShowerBase', { width: 2.4, height: 3.5, depth: 2.4 }, scene);
  showerBase.material = materials.windowGlass;
  showerBase.position.set(95.5, 1.8, 4.8);
  registerMesh(showerBase);
  collisionSystem.addBox(94, 97, 3.5, 6.2, 'apartment');

  // Hot Plate Counter & Cupboard at (104, -4.5)
  const kitchenCounter = MeshBuilder.CreateBox('aptKitchenCounter', { width: 3.5, height: 1.1, depth: 1.8 }, scene);
  kitchenCounter.material = materials.interiorCounter;
  kitchenCounter.position.set(104.2, 0.55, -4.8);
  registerMesh(kitchenCounter);

  const hotPlate = MeshBuilder.CreateBox('aptHotPlate', { width: 0.9, height: 0.15, depth: 0.7 }, scene);
  hotPlate.material = materials.metalDark;
  hotPlate.position.set(104, 1.15, -4.8);
  registerMesh(hotPlate);
  collisionSystem.addBox(102.2, 106.2, -6, -3.8, 'apartment');

  // TV & Armchair at (96, -4.5)
  const tvStand = MeshBuilder.CreateBox('aptTvStand', { width: 2.0, height: 0.8, depth: 0.8 }, scene);
  tvStand.material = materials.woodBench;
  tvStand.position.set(95.5, 0.4, -5.8);
  registerMesh(tvStand);

  const tvScreen = MeshBuilder.CreateBox('aptTvScreen', { width: 1.8, height: 1.2, depth: 0.2 }, scene);
  tvScreen.material = materials.windowGlass;
  tvScreen.position.set(95.5, 1.2, -5.8);
  registerMesh(tvScreen);

  const armchair = MeshBuilder.CreateBox('aptArmchair', { width: 1.6, height: 0.9, depth: 1.6 }, scene);
  armchair.material = materials.clothDenim;
  armchair.position.set(95.5, 0.45, -3.2);
  registerMesh(armchair);
  collisionSystem.addBox(94.2, 96.8, -6.5, -2.2, 'apartment');

  // Notice board on wall near door
  const rentBoard = MeshBuilder.CreateBox('aptRentNoticeBoard', { width: 0.1, height: 1.2, depth: 1.6 }, scene);
  rentBoard.material = materials.woodBench;
  rentBoard.position.set(93.3, 2.0, 1.8);
  registerMesh(rentBoard);

  // Interior Door exit
  const aptExitDoor = MeshBuilder.CreateBox('aptExitDoor', { width: 0.2, height: 2.8, depth: 1.8 }, scene);
  aptExitDoor.material = materials.doorWood;
  aptExitDoor.position.set(93.2, 1.4, 0);
  registerMesh(aptExitDoor);

  // ==========================================
  // 4. INTERIOR 2: MEL'S DINER (Center at x=200)
  // ==========================================
  const dinerFloor = MeshBuilder.CreateBox('dinerInteriorFloor', { width: 18, height: 0.2, depth: 18 }, scene);
  dinerFloor.material = materials.interiorFloor;
  dinerFloor.position.set(200, 0, 0);
  registerMesh(dinerFloor, false);

  makeIntWall('dinW_N', 200, 9, 18, 0.4);
  makeIntWall('dinW_S', 200, -9, 18, 0.4);
  makeIntWall('dinW_E', 209, 0, 0.4, 18);
  makeIntWall('dinW_W', 191, 0, 0.4, 18);
  collisionSystem.addBox(190, 210, 8.8, 9.5, 'diner');
  collisionSystem.addBox(190, 210, -9.5, -8.8, 'diner');
  collisionSystem.addBox(208.8, 209.5, -9, 9, 'diner');
  collisionSystem.addBox(190.5, 191.2, -9, 9, 'diner');

  // Counter & Kitchen Pass at x=203, z=0
  const dinerCounter = MeshBuilder.CreateBox('dinerMainCounter', { width: 2.0, height: 1.2, depth: 10 }, scene);
  dinerCounter.material = materials.interiorCounter;
  dinerCounter.position.set(203, 0.6, 0);
  registerMesh(dinerCounter);
  collisionSystem.addBox(201.8, 204.2, -5.2, 5.2, 'diner');

  // Kitchen Griddle behind counter (Shift station)
  const dinerGriddle = MeshBuilder.CreateBox('dinerGriddleStation', { width: 1.8, height: 1.1, depth: 5 }, scene);
  dinerGriddle.material = materials.metalDark;
  dinerGriddle.position.set(206.5, 0.55, 0);
  registerMesh(dinerGriddle);
  collisionSystem.addBox(205.4, 207.6, -2.6, 2.6, 'diner');

  // Manager Mel's Station / Time Clock at x=202, z=5.5
  const timeClock = MeshBuilder.CreateBox('dinerTimeClock', { width: 0.3, height: 0.8, depth: 0.6 }, scene);
  timeClock.material = materials.metalChrome;
  timeClock.position.set(203.8, 1.8, 5.2);
  registerMesh(timeClock);

  // Booth tables along West wall
  for (let z = -5; z <= 5; z += 5) {
    const table = MeshBuilder.CreateBox(`dinerTable_${z}`, { width: 2.2, height: 0.9, depth: 2.2 }, scene);
    table.material = materials.dinerCream;
    table.position.set(195, 0.45, z);
    registerMesh(table);
    collisionSystem.addBox(193.5, 196.5, z - 1.2, z + 1.2, 'diner');
  }

  // Jukebox at (193, -7.5)
  const jukebox = MeshBuilder.CreateBox('dinerJukebox', { width: 1.4, height: 2.2, depth: 1.2 }, scene);
  jukebox.material = materials.neonCyan;
  jukebox.position.set(193, 1.1, -7.5);
  registerMesh(jukebox);
  collisionSystem.addBox(192, 194, -8.2, -6.8, 'diner');

  // Diner interior exit door
  const dinerExitDoor = MeshBuilder.CreateBox('dinerExitDoor', { width: 0.2, height: 2.8, depth: 1.8 }, scene);
  dinerExitDoor.material = materials.doorWood;
  dinerExitDoor.position.set(191.2, 1.4, 0);
  registerMesh(dinerExitDoor);

  // ==========================================
  // 5. INTERIOR 3: QUIKSTOP CORNER MARKET (Center at x=300)
  // ==========================================
  const storeFloor = MeshBuilder.CreateBox('storeInteriorFloor', { width: 16, height: 0.2, depth: 16 }, scene);
  storeFloor.material = materials.interiorFloor;
  storeFloor.position.set(300, 0, 0);
  registerMesh(storeFloor, false);

  makeIntWall('stW_N', 300, 8, 16, 0.4);
  makeIntWall('stW_S', 300, -8, 16, 0.4);
  makeIntWall('stW_E', 308, 0, 0.4, 16);
  makeIntWall('stW_W', 292, 0, 0.4, 16);
  collisionSystem.addBox(291, 309, 7.8, 8.5, 'convenience');
  collisionSystem.addBox(291, 309, -8.5, -7.8, 'convenience');
  collisionSystem.addBox(307.8, 308.5, -8, 8, 'convenience');
  collisionSystem.addBox(291.5, 292.2, -8, 8, 'convenience');

  // Checkout counter at x=296, z=3
  const checkoutCounter = MeshBuilder.CreateBox('storeCheckoutCounter', { width: 3.5, height: 1.1, depth: 1.6 }, scene);
  checkoutCounter.material = materials.interiorCounter;
  checkoutCounter.position.set(296, 0.55, 3.5);
  registerMesh(checkoutCounter);
  collisionSystem.addBox(294, 298, 2.5, 4.5, 'convenience');

  // Center aisles / shelves at x=301, z=-1 and x=301, z=3
  const aisle1 = MeshBuilder.CreateBox('storeAisle1', { width: 1.6, height: 1.8, depth: 7 }, scene);
  aisle1.material = materials.metalDark;
  aisle1.position.set(302, 0.9, -1);
  registerMesh(aisle1);
  collisionSystem.addBox(301, 303, -4.6, 2.6, 'convenience');

  // Drink Fridge along East wall
  const drinkFridge = MeshBuilder.CreateBox('storeFridge', { width: 1.2, height: 2.6, depth: 8 }, scene);
  drinkFridge.material = materials.windowGlass;
  drinkFridge.position.set(307, 1.3, 0);
  registerMesh(drinkFridge);
  collisionSystem.addBox(306.2, 307.8, -4.2, 4.2, 'convenience');

  // Store exit door
  const storeExitDoor = MeshBuilder.CreateBox('storeExitDoor', { width: 0.2, height: 2.8, depth: 1.8 }, scene);
  storeExitDoor.material = materials.doorWood;
  storeExitDoor.position.set(292.2, 1.4, 0);
  registerMesh(storeExitDoor);

  return {
    rootNode,
    collisionSystem,
    doorMarkers,
    dispose: () => {
      rootNode.dispose();
    },
  };
}
