# Resume Blastroid - Game Generation Prompt

> **Purpose**: This document captures the complete essence of an interactive portfolio game. Feed this to an AI assistant to generate a functionally equivalent game without prior context.

---

## CONCEPT

Build an **Asteroids-style arcade game that doubles as an interactive portfolio website**. The player pilots a spaceship, destroys asteroids to reveal portals leading to portfolio sections (Work, About, Resume), and collects powerups that dramatically alter combat mechanics.

**Core Identity**:
- Genre: Arcade shooter / Interactive portfolio hybrid
- Visual Theme: "Void Neon" - pure black void with high-contrast neon elements, terminal/retro-futuristic aesthetic
- Platform: Browser-based, responsive canvas, 60 FPS target

---

## TECHNOLOGY

- **Rendering**: p5.js (2D graphics library via CDN)
- **Language**: Vanilla JavaScript with ES6+ class-based OOP
- **Architecture**: No build system - direct script loading in dependency order
- **Styling**: CSS for overlay sections only; game renders entirely on canvas

---

## VISUAL DESIGN PHILOSOPHY

**"Void Neon" Aesthetic**:
- Pure black/near-black background with no gradients or textures
- All game elements rendered with neon glow effects (achieved via multi-layer alpha rendering)
- Color carries meaning: each portfolio section has a distinct accent color
- Monospace/terminal typography
- No decorative shadows, chrome, or embellishments

**Color Semantic Mapping**:
- Ship: Bright neon yellow-green
- Work Section: Ember orange
- About Section: Aqua teal
- Resume Section: Sol yellow
- Neutral Elements: Gray
- Powerup types each have distinct colors (magenta, cyan, orange)

---

## GAME STATES

The game operates as a state machine with five states:

1. **INTRO**: Animated opening sequence with expanding particle halo, "START" text fade in/out, then asteroids spawn and fade in
2. **PLAYING**: Main gameplay - physics, collisions, spawning, combat
3. **TRANSITIONING**: Fade effect when entering/exiting portfolio sections
4. **SECTION**: Game paused, HTML overlay displays portfolio content
5. **DEAD**: Ship destruction animation (debris + expanding rings), respawn delay, then return to PLAYING

---

## ENTITIES

### Ship (Player)
- **Shape**: Triangle
- **Movement**: Rotate left/right (arrow keys), thrust forward (up arrow), momentum-based physics with friction and max speed cap
- **Screen Wrapping**: Exits one edge, enters opposite edge
- **Visual Effects**: Thrust flame, particle exhaust, afterimages (with certain powerups), neon glow states

### Asteroids (Enemies)
- **Four Types** mapped to portfolio sections plus neutral:
  - Work: Distinct color, hexagon-ish (6 vertices)
  - About: Distinct color, octagon-ish (8 vertices)
  - Resume: Distinct color, pentagon-ish (5 vertices)
  - Neutral: Gray, heptagon-ish (7 vertices)
- **Three Sizes**: Large (slow), Medium, Small (fast) - speed inversely proportional to size
- **Behavior**: Drift across screen, rotate slowly, wrap at edges
- **Spawning**: Continuously spawn from screen edges; always maintain at least one of each section type; cap total count
- **On Destruction**: Burst of colored particles; section types spawn a portal

### Bullets (Projectiles)
- **Basic**: Travel straight, inherit ship velocity, finite lifespan
- **Charged**: Larger size, variable speed based on charge level
- **Homing**: Steer toward locked targets with limited turn rate
- **Guided**: Follow bezier curve paths with obstacle avoidance
- **Ricochet**: Spawn from homing bullet impacts, spread in arc pattern
- **Trail Effects**: Homing bullets leave shimmering trails

### Beams (Special Weapon)
- Continuous energy beam extending from ship
- Scales in length/width based on charge
- Multi-layer color rendering with shimmer
- At high charge: helix spiral visual effect
- Destroys asteroids without consuming

### Powerups
- **Floating Powerups**: Spawn periodically at screen edges, drift slowly, must be shot to activate
- **Powerup Drops**: Created when floating powerup is shot; stationary, temporary, collected by ship contact
- **Three powerup lines** (mutually exclusive - activating one clears others)

### Portals
- Spawn at asteroid destruction location (section types only)
- Temporary (several seconds)
- Visual: Concentric glowing circles in section color
- Ship contact triggers transition to portfolio section

### Echoes (Special Projectile)
- Arc-shaped projectile matching forcefield shape
- Spawned during advanced boost activation
- Destroys asteroids in arc area

---

## POWERUP SYSTEM

Three mutually exclusive powerup lines, each with three tiers. Collecting the same type upgrades the tier; collecting a different type resets to that type's Tier I.

### HOMING LINE

**Tier I - Target Lock**:
- Hold fire button to aim at asteroid in forward cone
- Visual crosshair on target
- Release to fire guided bullet to target
- Faster, larger bullet than normal

**Tier II - Ricochet + Smart Pathing**:
- Bullets follow bezier curves with obstacle avoidance
- On asteroid impact: spawn multiple smaller ricochet bullets in spread pattern
- Enhanced visual trail effect

**Tier III - Multi-Target**:
- Lock multiple targets simultaneously (3 max)
- Distinct crosshair states: locked (solid) vs aiming (pulsing)
- Release fires at all locked targets
- More ricochets per impact

### CHARGESHOT LINE

**Tier I - Charged Projectile**:
- Hold fire button to charge (particles spiral toward ship)
- Release to fire scaled bullet (size/speed based on charge)
- Fire ring visual on release

**Tier II - Burst Fire**:
- Fires multiple bullets sequentially with spacing
- Enhanced muzzle flash
- Faster bullets
- Additional visual accents during charge

**Tier III - Energy Beam**:
- Replaces bullets with continuous beam
- Beam extends to full length over time
- Multi-layer rendering with shimmer
- At near-max charge: helix spiral patterns
- Screen flash effect during charge

### BOOST LINE

**Tier I - Enhanced Thrust**:
- Significantly faster rotation
- Increased thrust power
- Enhanced thrust particle effects (plume, swerve particles when turning)

**Tier II - Spot Boost + Forcefield**:
- **Spot Boost**: Double-tap thrust within tight window triggers instant velocity burst with afterimage trail
- **Surge Mode**: Hold thrust after spot boost to activate forward-facing forcefield arc
- Forcefield destroys asteroids on contact
- Higher thrust multiplier during surge
- Turning breaks forcefield (forces commitment)

**Tier III - Expanded Surge + Echo Projectile**:
- Wider forcefield arc
- Larger forcefield radius
- Ship glows during surge
- Afterburner flame effect
- Plasma jet particles on surge exit
- **Echo projectile** spawns on spot boost activation

---

## PARTICLE SYSTEM

Unified particle manager handling multiple distinct particle types:

1. **Explosion Particles**: Burst from destroyed asteroids in asteroid's color
2. **Intro Halo**: Ring of particles expanding from ship during intro
3. **Charge Particles**: Spiral inward toward ship during charging (color varies by powerup tier)
4. **Thrust Particles**: Various types - spray, plume (curls outward), swerve (on turning), surge (during forcefield), afterburner (large billowing), plasma jets
5. **Ship Debris**: Triangle fragments with rotation on death
6. **Death Rings**: Expanding circular rings on death (staggered timing)
7. **Fire Rings**: Expanding rings from charged shots

**Rendering**: Multi-layer glow effect (large transparent layer → smaller opaque core)

---

## COLLISION DETECTION

Collision types to implement:

1. **Bullet-Asteroid**: Destroy asteroid, spawn particles, award points, spawn portal if section type, generate ricochets if applicable
2. **Beam-Asteroid**: Line-circle collision, destroy without consuming beam
3. **Ship-Asteroid**: Player death
4. **Ship-Portal**: Transition to portfolio section
5. **Bullet-Powerup**: Convert floating powerup to collectible drop
6. **Ship-PowerupDrop**: Activate powerup
7. **Forcefield-Asteroid**: Arc collision detection (angle + distance), destroy asteroid
8. **Echo-Asteroid**: Arc collision detection, destroy asteroid
9. **Thrust Plume-Asteroid**: Small collision area on thrust particles can destroy asteroids (Boost I+)
10. **Thrust Plume-Powerup**: Thrust particles can convert floating powerups

---

## INPUT HANDLING

**Keyboard Controls**:
- **Arrow Keys**: LEFT/RIGHT rotate ship, UP applies thrust
- **Spacebar**: Fire (tap) or charge (hold) depending on powerup state
- **ESC**: Return from portfolio section to game

**Special Input Mechanics**:
- **Charge Detection**: Brief threshold before charging begins (distinguishes tap from hold)
- **Double-Tap Detection**: Track timing between thrust presses for Boost II spot boost (tight window)
- **Homing Targeting**: While holding fire with homing powerup, continuously track target in forward cone
- **Forcefield Breaking**: Any turn input during surge mode deactivates forcefield

---

## UI ELEMENTS

### Intro Screen
- Dark background
- Expanding particle halo from ship
- "START" text fades in and out
- Control legend showing arrow keys and spacebar

### Game HUD
- **Score**: Corner display, subdued color
- **Active Powerups**: Shows current powerup type and tier (e.g., "Homing II")

### Bottom Legend
- Asteroid type color key (Work, About, Resume)
- Control hint icons (arrow keys, spacebar)

### Portfolio Sections
- Fade transition to/from game
- HTML overlay with portfolio content
- Color-coded headers matching asteroid types
- ESC to return

---

## PORTFOLIO INTEGRATION

- Portfolio data loaded from JSON at startup
- Three sections accessible via portals: Work, About, Resume
- Section asteroids are always present (respawn system ensures at least one of each type)
- Destroying section asteroid creates portal at that location
- Portal is temporary - must be entered within time limit
- Game pauses while viewing section

---

## GAME LOOP STRUCTURE

```
preload: Load portfolio data JSON

setup: Create fullscreen canvas, initialize game

draw (every frame):
  if INTRO:
    Update intro animation timer
    Render ship, particles, UI
    Transition to PLAYING when complete

  if PLAYING:
    Process continuous input (arrow keys)
    Update all entity positions/physics
    Check all collisions
    Spawn asteroids if below threshold
    Spawn powerups periodically
    Update particle system
    Render everything

  if TRANSITIONING:
    Update fade alpha
    Render game dimmed
    Switch to SECTION or PLAYING when fade complete

  if SECTION:
    Game frozen
    Portfolio overlay visible
    Wait for ESC

  if DEAD:
    Update death animation (debris, rings)
    Decrement respawn timer
    When timer expires: respawn ship, clear nearby asteroids, return to PLAYING

keyPressed/keyReleased:
  Handle discrete input events (space, up arrow double-tap, ESC)
```

---

## CRITICAL IMPLEMENTATION DETAILS

1. **Powerup Exclusivity**: Activating any powerup must completely clear the other two types
2. **Asteroid Balance**: Spawning logic must always ensure at least one asteroid of each section type exists
3. **Screen Wrapping**: All moving entities wrap at screen edges with appropriate buffer for their radius
4. **Charge Threshold**: Don't show charging visuals until held past threshold (prevents flickering on quick taps)
5. **Double-Tap Window**: Must be tight enough to prevent accidental triggers during normal thrust
6. **Forcefield Commitment**: Turning must break forcefield to create risk/reward for surge mode
7. **Homing Pathfinding**: Bezier curves should dynamically route around obstacles
8. **Death Safety Zone**: On respawn, clear asteroids near center so player isn't immediately killed
9. **Particle Separation**: Use separate arrays for different particle types (not one mixed array) for clean updates
10. **Script Dependencies**: Constants must load before entities, entities before systems, systems before main game, main game before p5 lifecycle

---

## SUMMARY PROMPT

> Create an Asteroids-style arcade game that serves as an interactive portfolio. The player flies a neon-glowing triangle ship through a void-black space, destroying jagged polygon asteroids. Four asteroid types exist - three represent portfolio sections (Work, About, Resume) with distinct colors, plus neutral gray asteroids. Destroying a section asteroid spawns a temporary glowing portal; flying into the portal transitions to that portfolio section.
>
> Implement three mutually exclusive powerup lines, each with three upgrade tiers:
> - **Homing**: Target locking → ricochet bullets with smart pathing → multi-target lock
> - **ChargeShot**: Charged projectiles → burst fire → continuous energy beam
> - **Boost**: Enhanced thrust → double-tap spot boost with forcefield → expanded forcefield with echo projectile
>
> Include a unified particle system for explosions, thrust effects, charging visuals, death animations, and beam particles. Use multi-layer glow rendering for all neon effects. Build a state machine with Intro, Playing, Transitioning, Section, and Dead states. The visual theme is "Void Neon" - pure black backgrounds with high-contrast neon accents, terminal-aesthetic typography, no gradients or decorative elements.
>
> Controls: Arrow keys for movement, spacebar for shooting/charging, ESC to exit sections. All entities wrap at screen edges. Asteroids spawn continuously from edges. Powerups spawn periodically and must be shot to activate.
