import React, { useState } from 'react';
import { Game } from '../Game';
import { GameSettings } from '../core/Types';
import { SaveManager } from '../save/SaveManager';
import { Sliders, Volume2, Monitor, MousePointer, RotateCcw, X } from 'lucide-react';

interface SettingsModalProps {
  game: Game;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ game, onClose }) => {
  const [settings, setSettings] = useState<GameSettings>(game.getSettings());

  const handleChange = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    game.applySettings(updated);
  };

  const handleReset = () => {
    const defaults = SaveManager.DEFAULT_SETTINGS;
    setSettings(defaults);
    game.applySettings(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md pointer-events-auto">
      <div className="w-full max-w-md flex flex-col rounded-3xl bg-stone-900 border-2 border-stone-700/80 shadow-2xl text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-white">Settings</h3>
              <p className="text-xs text-stone-400">Audio, controls, and rendering quality</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Audio section */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
              <Volume2 className="w-4 h-4" />
              <span>Audio Synthesis</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1 text-stone-300">
                  <span>Master Volume</span>
                  <span className="font-mono text-stone-400">{Math.round(settings.masterVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.masterVolume}
                  onChange={(e) => handleChange('masterVolume', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-stone-300">
                  <span>Procedural Lofi Music</span>
                  <span className="font-mono text-stone-400">{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume}
                  onChange={(e) => handleChange('musicVolume', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-stone-300">
                  <span>Sound Effects</span>
                  <span className="font-mono text-stone-400">{Math.round(settings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.sfxVolume}
                  onChange={(e) => handleChange('sfxVolume', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-stone-300">
                  <span>City Ambience</span>
                  <span className="font-mono text-stone-400">{Math.round(settings.ambienceVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.ambienceVolume}
                  onChange={(e) => handleChange('ambienceVolume', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-stone-800" />

          {/* Controls section */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
              <MousePointer className="w-4 h-4" />
              <span>Camera Controls</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1 text-stone-300">
                  <span>Mouse Look Sensitivity</span>
                  <span className="font-mono text-stone-400">{settings.mouseSensitivity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.1"
                  value={settings.mouseSensitivity}
                  onChange={(e) => handleChange('mouseSensitivity', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-stone-300">Invert Camera Pitch (Y-Axis)</span>
                <button
                  onClick={() => handleChange('invertY', !settings.invertY)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    settings.invertY ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {settings.invertY ? 'Inverted' : 'Standard'}
                </button>
              </div>
            </div>
          </div>

          <div className="h-px bg-stone-800" />

          {/* Graphics Quality */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
              <Monitor className="w-4 h-4" />
              <span>Graphics & Shadows</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => handleChange('graphicsQuality', q)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'bg-amber-500 text-stone-950 shadow-md'
                      : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950/60 border-t border-stone-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
