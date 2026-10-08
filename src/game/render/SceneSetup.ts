import {
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Scene,
  ShadowGenerator,
  Vector3,
} from '@babylonjs/core';
import { GameSettings } from '../core/Types';
import { createMaterialLibrary, MaterialLibrary } from './Materials';

export interface SceneContext {
  engine: Engine;
  scene: Scene;
  materials: MaterialLibrary;
  sunLight: DirectionalLight;
  hemiLight: HemisphericLight;
  shadowGenerator: ShadowGenerator | null;
  updateDayNight: (normalizedTime: number) => void;
  applyQuality: (quality: GameSettings['graphicsQuality']) => void;
  dispose: () => void;
}

export function setupBabylonScene(canvas: HTMLCanvasElement, initialQuality: GameSettings['graphicsQuality']): SceneContext {
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: false,
    powerPreference: 'high-performance',
    antialias: initialQuality !== 'low',
  });

  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.82, 0.88, 0.94, 1.0);
  scene.ambientColor = new Color3(0.2, 0.2, 0.25);

  // Gentle atmospheric fog to soften world edge
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0075;
  scene.fogColor = new Color3(0.85, 0.88, 0.92);

  // Hemispheric fill light (sky/ground contrast)
  const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
  hemiLight.diffuse = new Color3(0.9, 0.92, 0.95);
  hemiLight.groundColor = new Color3(0.35, 0.38, 0.42);
  hemiLight.intensity = 0.65;

  // Directional sun light
  const sunLight = new DirectionalLight('sunLight', new Vector3(-0.6, -1.0, 0.5), scene);
  sunLight.position = new Vector3(30, 60, -30);
  sunLight.diffuse = new Color3(1.0, 0.94, 0.82);
  sunLight.specular = new Color3(0.3, 0.3, 0.25);
  sunLight.intensity = 1.1;

  // Material Library
  const materials = createMaterialLibrary(scene);

  // Shadow generator setup
  let shadowGenerator: ShadowGenerator | null = null;
  if (initialQuality !== 'low') {
    shadowGenerator = new ShadowGenerator(1024, sunLight);
    shadowGenerator.useContactHardeningShadow = false;
    shadowGenerator.usePoissonSampling = true;
    shadowGenerator.bias = 0.002;
  }

  // Day/night cycle updater
  const updateDayNight = (normalizedTime: number) => {
    // normalizedTime: 0.0 = 00:00, 0.25 = 06:00, 0.5 = 12:00, 0.75 = 18:00, 1.0 = 24:00
    // Sun angle orbit
    const sunAngle = (normalizedTime - 0.25) * Math.PI * 2;
    const sunY = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle);

    sunLight.direction = new Vector3(-sunX, -Math.max(0.2, Math.abs(sunY)), -0.3).normalize();

    // Day vs dusk vs night
    const isDay = normalizedTime >= 0.25 && normalizedTime <= 0.78;
    const isGoldenHour = (normalizedTime >= 0.23 && normalizedTime <= 0.3) || (normalizedTime >= 0.7 && normalizedTime <= 0.8);
    const isNight = normalizedTime < 0.22 || normalizedTime > 0.82;

    if (isNight) {
      // Deep blue twilight / night
      hemiLight.diffuse = new Color3(0.18, 0.22, 0.38);
      hemiLight.groundColor = new Color3(0.08, 0.10, 0.18);
      hemiLight.intensity = 0.35;

      sunLight.diffuse = new Color3(0.25, 0.32, 0.55); // moonlight
      sunLight.intensity = 0.3;

      scene.fogColor = new Color3(0.10, 0.12, 0.22);
      scene.clearColor = new Color4(0.08, 0.10, 0.20, 1.0);

      // Window and street glow active at night
      materials.windowLit.emissiveColor = new Color3(0.95, 0.82, 0.4);
      materials.lampGlow.emissiveColor = new Color3(1.0, 0.9, 0.5);
    } else if (isGoldenHour) {
      // Warm golden late afternoon
      hemiLight.diffuse = new Color3(0.95, 0.82, 0.70);
      hemiLight.intensity = 0.6;

      sunLight.diffuse = new Color3(1.0, 0.75, 0.45);
      sunLight.intensity = 1.25;

      scene.fogColor = new Color3(0.92, 0.82, 0.74);
      scene.clearColor = new Color4(0.88, 0.78, 0.70, 1.0);

      materials.windowLit.emissiveColor = new Color3(0.6, 0.45, 0.2);
      materials.lampGlow.emissiveColor = new Color3(0.9, 0.7, 0.3);
    } else {
      // Crisp daylight
      hemiLight.diffuse = new Color3(0.92, 0.94, 0.98);
      hemiLight.groundColor = new Color3(0.40, 0.42, 0.46);
      hemiLight.intensity = 0.7;

      sunLight.diffuse = new Color3(1.0, 0.96, 0.88);
      sunLight.intensity = 1.15;

      scene.fogColor = new Color3(0.84, 0.88, 0.94);
      scene.clearColor = new Color4(0.80, 0.86, 0.94, 1.0);

      materials.windowLit.emissiveColor = new Color3(0.1, 0.1, 0.1);
      materials.lampGlow.emissiveColor = new Color3(0.3, 0.28, 0.2);
    }
  };

  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const applyQuality = (quality: GameSettings['graphicsQuality']) => {
    switch (quality) {
      case 'low':
        engine.setHardwareScalingLevel(isMobile ? 1.5 : 1.35);
        if (shadowGenerator) {
          shadowGenerator.dispose();
          shadowGenerator = null;
        }
        scene.fogDensity = 0.01;
        break;
      case 'medium':
        engine.setHardwareScalingLevel(isMobile ? 1.25 : 1.0);
        if (!shadowGenerator) {
          shadowGenerator = new ShadowGenerator(1024, sunLight);
          shadowGenerator.bias = 0.002;
        }
        scene.fogDensity = 0.0075;
        break;
      case 'high':
        engine.setHardwareScalingLevel(isMobile ? 1.0 : 0.85);
        if (!shadowGenerator) {
          shadowGenerator = new ShadowGenerator(1024, sunLight);
          shadowGenerator.bias = 0.002;
        }
        scene.fogDensity = 0.006;
        break;
    }
  };

  applyQuality(initialQuality);

  return {
    engine,
    scene,
    materials,
    sunLight,
    hemiLight,
    shadowGenerator,
    updateDayNight,
    applyQuality,
    dispose: () => {
      if (shadowGenerator) shadowGenerator.dispose();
      materials.asphalt.dispose();
      scene.dispose();
      engine.dispose();
    },
  };
}
