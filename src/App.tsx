import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Game, GameSnapshot } from './game/Game';
import { TitleScreen } from './game/ui/TitleScreen';
import { HUD } from './game/ui/HUD';
import { ShopModal } from './game/ui/ShopModal';
import { InventoryModal } from './game/ui/InventoryModal';
import { ShiftMinigameModal } from './game/ui/ShiftMinigameModal';
import { ShiftSummaryModal } from './game/ui/ShiftSummaryModal';
import { SleepModal } from './game/ui/SleepModal';
import { DialogueModal } from './game/ui/DialogueModal';
import { PauseModal } from './game/ui/PauseModal';
import { SettingsModal } from './game/ui/SettingsModal';
import { ToastContainer } from './game/ui/ToastContainer';
import { TouchControls } from './game/ui/TouchControls';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [showSettingsFromTitle, setShowSettingsFromTitle] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Check WebGL support
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setInitError('WebGL is not supported or hardware acceleration is disabled in your browser.');
        return;
      }

      // Initialize game coordinator
      const gameInstance = new Game(canvas);
      setGame(gameInstance);

      // Start Babylon.js master render loop
      const engine = gameInstance.sceneCtx.engine;
      engine.runRenderLoop(() => {
        const deltaSec = engine.getDeltaTime() / 1000;
        gameInstance.tick(Math.min(0.1, deltaSec)); // clamp large delta spikes
        gameInstance.sceneCtx.scene.render();
      });

      // Window resize handling
      const handleResize = () => {
        engine.resize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        engine.stopRenderLoop();
        gameInstance.dispose();
      };
    } catch (err: any) {
      console.error('Failed to initialize 3D scene:', err);
      setInitError(err?.message || 'An unexpected error occurred starting the 3D engine.');
    }
  }, []);

  // Subscribe to game store for synchronized React UI overlay
  const snapshot = useSyncExternalStore<GameSnapshot | null>(
    (cb) => (game ? game.subscribe(cb) : () => {}),
    () => (game ? game.getSnapshot() : null)
  );

  if (initError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-stone-950 p-6 text-stone-100">
        <div className="max-w-md p-8 rounded-3xl bg-stone-900 border-2 border-red-500/80 shadow-2xl text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-display text-white mb-2">Graphics Initialization Issue</h2>
          <p className="text-sm text-stone-400 leading-relaxed mb-6">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Everyday
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-stone-950 font-sans">
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full outline-none block"
        tabIndex={0}
      />

      {/* React Game UI Overlays */}
      {game && snapshot && (
        <>
          {/* Toast Notification Stack */}
          <ToastContainer />

          {/* Title Screen */}
          {snapshot.phase === 'title' && (
            <TitleScreen
              game={game}
              onOpenSettings={() => setShowSettingsFromTitle(true)}
            />
          )}

          {/* In-Game HUD (during playing or pause) */}
          {(snapshot.phase === 'playing' || snapshot.phase === 'paused') && (
            <HUD
              snapshot={snapshot}
              onOpenInventory={() => game.openModal('inventory')}
              onOpenPause={() => game.pauseGame()}
            />
          )}

          {/* Virtual Joystick and Touch Action Buttons on mobile/touch */}
          {snapshot.phase === 'playing' && !snapshot.activeModal && (
            <TouchControls
              game={game}
              snapshot={snapshot}
            />
          )}

          {/* Line Cook Minigame Overlay */}
          {snapshot.phase === 'minigame' && game.activeMinigame && (
            <ShiftMinigameModal
              game={game}
              minigame={game.activeMinigame}
            />
          )}

          {/* Modals */}
          {snapshot.activeModal === 'shop' && snapshot.activeShopCategory && (
            <ShopModal
              game={game}
              category={snapshot.activeShopCategory}
              onClose={() => game.closeModal()}
            />
          )}

          {snapshot.activeModal === 'inventory' && (
            <InventoryModal
              game={game}
              onClose={() => game.closeModal()}
            />
          )}

          {snapshot.activeModal === 'sleep' && (
            <SleepModal
              game={game}
              onClose={() => game.closeModal()}
            />
          )}

          {snapshot.activeModal === 'dialogue' && snapshot.dialogueContent && (
            <DialogueModal
              title={snapshot.dialogueContent.title}
              lines={snapshot.dialogueContent.lines}
              actionLabel={snapshot.dialogueContent.actionLabel}
              onAction={snapshot.dialogueContent.onAction}
              onClose={() => game.closeModal()}
            />
          )}

          {snapshot.activeModal === 'shift_summary' && snapshot.shiftSummary && (
            <ShiftSummaryModal
              summary={snapshot.shiftSummary}
              onCollect={() => game.closeModal()}
            />
          )}

          {snapshot.phase === 'paused' && (
            <PauseModal
              game={game}
              onResume={() => game.resumeGame()}
              onOpenSettings={() => game.openModal('settings')}
              onQuit={() => game.quitToTitle()}
            />
          )}

          {(snapshot.activeModal === 'settings' || showSettingsFromTitle) && (
            <SettingsModal
              game={game}
              onClose={() => {
                setShowSettingsFromTitle(false);
                if (snapshot.activeModal === 'settings') {
                  game.closeModal();
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
