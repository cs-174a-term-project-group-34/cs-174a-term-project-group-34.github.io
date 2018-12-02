# Fishing Simulator
## How to Play:

 1. Start `host.command` or `host.bat` server
 2. Navigate to `localhost:8000` in Chrome
 3. Click and move mouse to look around
 4. Use W,A,S,D to move
 5. To play fishing game, walk to the end of the dock. A pop-up should indicate that fishing mode can be entered by pressing F
 6. Use mouse to aim and C to cast. Ripples in the water indicate where fishes are likely to be.
 7. After casting wait for a bite. Press X to reel in and recast
 8. Once a fish bites, the minigame overlay will show up. Press X to keep the blue line within the green bar and fill up the progress meter (orange). The fish is caught if the progress meter fills up and lost if the meter runs empty.

## Controls

### General:
**W,A,S,D**: Move player
**Shift**: Run
**Mouse**: Rotate view
**F**: Enter fishing mode (while on dock edge)
### Fishing Mode:
**C**: Hold to charge cast, release to cast
**X**: Reel in line
**F**: Reset rod after cast, exit fishing mode

## Advanced Features

 - Shadows (Shadow Mapping)
 - Bump Mapping
 - Reflections
 - Heightmap

## Contributions
**Prathyush**: Implemented bump mapping, shadows, reflections, and heightmap. Wrote player movement controls.
**Christian**: Wrote most of the game logic, created game animations and models. Made heightmap and terrain texture.
**Nathan:** Created 2d overlay graphics, implemented levels and scoring. Added sounds.
