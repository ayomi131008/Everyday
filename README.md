# Everyday - 3D Life Simulation

"Everyday" is an original, stylized 3D third-person life simulation game set in Dunmore Square, Brightwater. You arrive with a duffel bag, $60, and a rented room. Get a job at Mel's Diner, flip burgers, pay your rent every 3 days, keep your hunger, energy, hygiene, and fun balanced, and build a sustainable routine.

## Controls

### Desktop (Keyboard & Mouse)
- **WASD / Arrow Keys**: Move character (camera-relative)
- **Mouse**: Rotate camera (Click canvas for pointer lock; ESC to pause & unlock)
- **Shift**: Sprint (drains extra energy)
- **Mouse Wheel**: Zoom camera in/out
- **E**: Interact with doors, bed, shower, hot plate, diner counter, manager, shop, etc.
- **Tab / I**: Open Inventory
- **Esc**: Pause menu, Settings, Wallet history, Save game

### Mobile & Touchscreen (Chrome Mobile, Opera Mini, Safari, etc.)
- **On-Screen Analog Joystick (Bottom-Left)**: Drag thumbstick in any direction to move
- **Touch Camera Drag (Right Screen Area)**: Drag finger anywhere on the right screen to smoothly orbit and rotate camera
- **Pinch-to-Zoom**: Pinch with two fingers to zoom camera in and out
- **[E] Interact Button (Bottom-Right)**: Big contextual button that illuminates and pulses when an object or NPC is in range
- **Sprint Button (Bottom-Right)**: Quick toggle to sprint
- **Top Quick Actions**: Instant tap for Bag and Pause / Menu
- **Optimized Mobile Performance**: Dynamic hardware scaling automatically adjusts for high-DPI phone screens, battery-friendly rendering, and automatic WebAudio touch unlock.

## Architecture & Project Structure
- `src/game/core/`: EventBus, Clock, Types, Rng
- `src/game/config/`: Data-driven configurations (`balance.ts`, `items.ts`, `jobs.ts`, `locations.ts`, `objectives.ts`)
- `src/game/sim/`: Pure logic simulation modules (`Needs.ts`, `Economy.ts`, `Inventory.ts`, `Rent.ts`)
- `src/game/render/`: Babylon.js engine, materials palette, warm lighting & day/night sky dome, quality settings
- `src/game/world/`: Procedural 3D Dunmore Square (buildings, street props, colliders, interiors)
- `src/game/player/`: Procedural humanoid character, walk/run/idle/sit animations, third-person camera rig with collision
- `src/game/interaction/`: Interactable zones, screen/world prompts, debouncing, door transitions
- `src/game/jobs/`: Job framework & Mel's Diner cooking/order assembly minigame
- `src/game/save/`: Versioned localStorage save/load with checksum verification & automatic backup recovery
- `src/game/audio/`: WebAudio procedural synthesizer (footsteps, coins, grill sizzle, UI tones, ambient hum)
- `src/game/ui/`: React HUD, modals, Title, Shift minigame, Shop, Sleep dialog, Settings, Toasts
- `src/tests/`: Unit tests and economy/balance simulation runner

## Adding New Content
- **New Jobs**: Add an entry in `src/game/config/jobs.ts` specifying pay rate, hours, location, and task generator.
- **New Items**: Add definitions in `src/game/config/items.ts` with cost, hunger/energy/fun/hygiene effects, and shop category.
- **New Buildings/Interactables**: Register in `src/game/config/locations.ts` and add procedural geometry in `WorldBuilder.ts`.

## Running & Testing
- `npm run dev`: Launch local development server
- `npm run build`: Compile and build production bundle
- `npm run test`: Run unit tests and balance simulation
