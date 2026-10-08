import { Color3, Scene, StandardMaterial } from '@babylonjs/core';

export interface MaterialLibrary {
  // World surfaces
  asphalt: StandardMaterial;
  sidewalk: StandardMaterial;
  grass: StandardMaterial;
  curb: StandardMaterial;
  crosswalkWhite: StandardMaterial;

  // Buildings & Architecture
  brickRed: StandardMaterial;
  brickDark: StandardMaterial;
  apartmentTan: StandardMaterial;
  dinerMint: StandardMaterial;
  dinerCream: StandardMaterial;
  storeYellow: StandardMaterial;
  roofDark: StandardMaterial;
  doorWood: StandardMaterial;
  windowGlass: StandardMaterial;
  windowLit: StandardMaterial;

  // Accents & Props
  metalDark: StandardMaterial;
  metalChrome: StandardMaterial;
  woodBench: StandardMaterial;
  hydrantRed: StandardMaterial;
  foliageGreen: StandardMaterial;
  foliageAutumn: StandardMaterial;
  barkBrown: StandardMaterial;
  neonCyan: StandardMaterial;
  neonPink: StandardMaterial;
  lampGlow: StandardMaterial;

  // Character & Furniture
  skinTone: StandardMaterial;
  clothDenim: StandardMaterial;
  clothShirt: StandardMaterial;
  clothApron: StandardMaterial;
  hairBrown: StandardMaterial;
  shoesDark: StandardMaterial;
  interiorWall: StandardMaterial;
  interiorFloor: StandardMaterial;
  interiorCounter: StandardMaterial;
}

export function createMaterialLibrary(scene: Scene): MaterialLibrary {
  const makeMat = (name: string, diffuse: Color3, specular: Color3 = new Color3(0.05, 0.05, 0.05), emissive?: Color3) => {
    const mat = new StandardMaterial(name, scene);
    mat.diffuseColor = diffuse;
    mat.specularColor = specular;
    if (emissive) {
      mat.emissiveColor = emissive;
    }
    // Optimization: freeze static materials
    return mat;
  };

  const lib: MaterialLibrary = {
    // Surfaces
    asphalt: makeMat('mat_asphalt', new Color3(0.22, 0.23, 0.26)),
    sidewalk: makeMat('mat_sidewalk', new Color3(0.72, 0.70, 0.67)),
    grass: makeMat('mat_grass', new Color3(0.36, 0.58, 0.32)),
    curb: makeMat('mat_curb', new Color3(0.60, 0.58, 0.55)),
    crosswalkWhite: makeMat('mat_crosswalk', new Color3(0.92, 0.90, 0.88)),

    // Architecture
    brickRed: makeMat('mat_brickRed', new Color3(0.65, 0.28, 0.24)),
    brickDark: makeMat('mat_brickDark', new Color3(0.48, 0.22, 0.20)),
    apartmentTan: makeMat('mat_aptTan', new Color3(0.82, 0.74, 0.64)),
    dinerMint: makeMat('mat_dinerMint', new Color3(0.40, 0.72, 0.68)),
    dinerCream: makeMat('mat_dinerCream', new Color3(0.95, 0.92, 0.82)),
    storeYellow: makeMat('mat_storeYellow', new Color3(0.88, 0.68, 0.25)),
    roofDark: makeMat('mat_roofDark', new Color3(0.18, 0.20, 0.22)),
    doorWood: makeMat('mat_doorWood', new Color3(0.45, 0.28, 0.18)),
    windowGlass: makeMat('mat_winGlass', new Color3(0.20, 0.35, 0.45), new Color3(0.4, 0.4, 0.4)),
    windowLit: makeMat('mat_winLit', new Color3(0.9, 0.8, 0.5), new Color3(0.1, 0.1, 0.1), new Color3(0.8, 0.7, 0.3)),

    // Props & Street
    metalDark: makeMat('mat_metalDark', new Color3(0.25, 0.27, 0.29)),
    metalChrome: makeMat('mat_metalChrome', new Color3(0.85, 0.87, 0.90), new Color3(0.6, 0.6, 0.6)),
    woodBench: makeMat('mat_woodBench', new Color3(0.55, 0.35, 0.22)),
    hydrantRed: makeMat('mat_hydrantRed', new Color3(0.85, 0.18, 0.15)),
    foliageGreen: makeMat('mat_foliageGreen', new Color3(0.28, 0.52, 0.25)),
    foliageAutumn: makeMat('mat_foliageAutumn', new Color3(0.85, 0.45, 0.20)),
    barkBrown: makeMat('mat_barkBrown', new Color3(0.35, 0.25, 0.18)),
    neonCyan: makeMat('mat_neonCyan', new Color3(0.2, 0.85, 0.9), new Color3(0.2, 0.2, 0.2), new Color3(0.2, 0.8, 0.85)),
    neonPink: makeMat('mat_neonPink', new Color3(0.95, 0.25, 0.6), new Color3(0.2, 0.2, 0.2), new Color3(0.9, 0.2, 0.55)),
    lampGlow: makeMat('mat_lampGlow', new Color3(1.0, 0.9, 0.6), new Color3(0.1, 0.1, 0.1), new Color3(1.0, 0.85, 0.4)),

    // Characters & Interiors
    skinTone: makeMat('mat_skin', new Color3(0.86, 0.68, 0.56)),
    clothDenim: makeMat('mat_denim', new Color3(0.22, 0.34, 0.50)),
    clothShirt: makeMat('mat_shirt', new Color3(0.90, 0.55, 0.35)),
    clothApron: makeMat('mat_apron', new Color3(0.88, 0.88, 0.85)),
    hairBrown: makeMat('mat_hair', new Color3(0.30, 0.22, 0.18)),
    shoesDark: makeMat('mat_shoes', new Color3(0.15, 0.15, 0.16)),
    interiorWall: makeMat('mat_intWall', new Color3(0.86, 0.84, 0.80)),
    interiorFloor: makeMat('mat_intFloor', new Color3(0.58, 0.42, 0.32)),
    interiorCounter: makeMat('mat_intCounter', new Color3(0.78, 0.75, 0.72)),
  };

  return lib;
}
