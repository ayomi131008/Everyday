import React, { useRef, useState, useEffect } from 'react';
import { Game, GameSnapshot } from '../Game';
import { Zap, Hand, ChevronUp } from 'lucide-react';

interface TouchControlsProps {
  game: Game;
  snapshot: GameSnapshot;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ game, snapshot }) => {
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSprinting, setIsSprinting] = useState(false);
  const activeTouchIdRef = useRef<number | null>(null);
  const centerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const maxRadius = 42; // maximum joystick radius in px

  const handleJoystickTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activeTouchIdRef.current !== null) return;

    const touch = e.changedTouches[0];
    activeTouchIdRef.current = touch.identifier;

    if (joystickRef.current) {
      const rect = joystickRef.current.getBoundingClientRect();
      centerPosRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      updateJoystickPosition(touch.clientX, touch.clientY);
    }
  };

  const handleJoystickTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activeTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchIdRef.current) {
        updateJoystickPosition(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activeTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchIdRef.current) {
        activeTouchIdRef.current = null;
        setKnobPos({ x: 0, y: 0 });
        game.inputManager.setVirtualMove(0, 0);
        break;
      }
    }
  };

  const updateJoystickPosition = (clientX: number, clientY: number) => {
    const dx = clientX - centerPosRef.current.x;
    const dy = clientY - centerPosRef.current.y;
    const dist = Math.hypot(dx, dy);

    let clampedX = dx;
    let clampedY = dy;

    if (dist > maxRadius) {
      clampedX = (dx / dist) * maxRadius;
      clampedY = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: clampedX, y: clampedY });

    // Invert Y so up is forward (+1), right is +1
    const forward = -(clampedY / maxRadius);
    const right = clampedX / maxRadius;
    game.inputManager.setVirtualMove(forward, right);
  };

  const toggleSprint = () => {
    const next = !isSprinting;
    setIsSprinting(next);
    game.inputManager.setVirtualSprint(next);
  };

  const handleInteract = () => {
    game.inputManager.triggerInteract();
  };

  const hasPrompt = snapshot.prompt !== null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none touch-none overflow-hidden">
      {/* ================= BOTTOM-LEFT: VIRTUAL JOYSTICK ================= */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <div
          ref={joystickRef}
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          onTouchCancel={handleJoystickTouchEnd}
          className="relative w-28 h-28 rounded-full bg-stone-950/60 backdrop-blur-md border-2 border-stone-700/80 shadow-2xl flex items-center justify-center touch-none cursor-pointer active:border-amber-500/80 transition-colors"
        >
          {/* Subtle directional indicators */}
          <div className="absolute top-1 text-[9px] font-bold text-stone-500 uppercase">W</div>
          <div className="absolute bottom-1 text-[9px] font-bold text-stone-500 uppercase">S</div>
          <div className="absolute left-1.5 text-[9px] font-bold text-stone-500 uppercase">A</div>
          <div className="absolute right-1.5 text-[9px] font-bold text-stone-500 uppercase">D</div>

          {/* Thumb stick knob */}
          <div
            className="w-12 h-12 rounded-full bg-amber-500/90 border-2 border-amber-300 shadow-xl shadow-amber-500/30 flex items-center justify-center transform transition-transform duration-75"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-stone-900/40" />
          </div>
        </div>
      </div>

      {/* ================= BOTTOM-RIGHT: ACTION BUTTONS ================= */}
      <div className="absolute bottom-6 right-6 flex items-end gap-3 pointer-events-auto">
        {/* Sprint Toggle Button */}
        <button
          onClick={toggleSprint}
          className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 shadow-xl transition-all active:scale-95 cursor-pointer backdrop-blur-md ${
            isSprinting
              ? 'bg-amber-500 border-amber-300 text-stone-950 shadow-amber-500/30 font-bold'
              : 'bg-stone-900/80 border-stone-700 text-stone-300 hover:border-stone-500'
          }`}
          title="Toggle Sprint"
        >
          <Zap className={`w-5 h-5 ${isSprinting ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Run</span>
        </button>

        {/* Interact Button [E] */}
        <button
          onClick={handleInteract}
          disabled={!hasPrompt || !!snapshot.prompt?.disabledReason}
          className={`min-w-[76px] h-18 px-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 shadow-2xl transition-all active:scale-95 cursor-pointer backdrop-blur-md ${
            hasPrompt && !snapshot.prompt?.disabledReason
              ? 'bg-amber-500 border-amber-300 text-stone-950 shadow-amber-500/40 animate-pulse font-black'
              : hasPrompt && snapshot.prompt?.disabledReason
              ? 'bg-stone-900/80 border-red-500/50 text-red-300 opacity-80'
              : 'bg-stone-900/70 border-stone-700 text-stone-500 opacity-60'
          }`}
        >
          <div className="flex items-center gap-1 text-sm font-black uppercase tracking-wider font-display">
            <span>[E]</span>
            <Hand className="w-4 h-4 fill-current" />
          </div>
          <span className="text-[11px] font-bold tracking-tight text-center leading-tight max-w-[85px] truncate">
            {hasPrompt ? snapshot.prompt?.verb || 'Interact' : 'Interact'}
          </span>
        </button>
      </div>

      {/* Helpful small tip on initial touch */}
      <div className="absolute top-20 right-6 text-[10px] text-stone-400 bg-stone-950/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-stone-800 pointer-events-none hidden sm:block">
        Drag right half to rotate camera &bull; Pinch to zoom
      </div>
    </div>
  );
};
