const GameState = {
  INTRO: 'intro',
  PLAYING: 'playing',
  TRANSITIONING: 'transitioning',
  SECTION: 'section',
  DEAD: 'dead'
};

class Game {
  constructor() {
    this.state = GameState.PLAYING;
    this.ship = null;
    this.asteroids = [];
    this.bullets = [];
    this.currentSection = null;

    // Particle System
    this.particleSystem = new ParticleSystem();

    // Transition animation
    this.fadeAlpha = 0;
    this.fadeDirection = 0;  // 1 = fading out, -1 = fading in

    // Asteroid management
    this.asteroidTypes = ['work', 'about', 'resume', 'neutral'];
    this.sectionTypes = ['work', 'about', 'resume'];
    this.maxAsteroids = 10;

    // Score
    this.score = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 180;  // frames between spawns

    // Ship death/respawn
    this.shipDeathTimer = 0;
    this.shipDeathDuration = 180;  // 3 seconds at 60fps
    this.shipRespawnDelay = 120;   // 2 seconds before respawn
    // deathRings and shipDebris moved to ParticleSystem

    // Portals
    this.portals = [];

    // Charged shot
    this.isCharging = false;
    this.chargeLevel = 0;
    this.maxChargeLevel = 90;      // 1.5 seconds at 60fps
    // chargeParticles moved to ParticleSystem
    this.spaceHeld = false;
    this.spaceHoldTime = 0;
    this.chargeThreshold = 12;     // ~200ms before charging starts

    // Powerups
    this.powerups = [];           // Floating powerup entities
    this.powerupDrops = [];       // Collectibles after shooting
    this.activePowerups = {       // Currently held powerups
      homing: 0,            // 0 = none, 1 = Homing I, 2 = Homing II
      chargeshot: 0         // 0 = none, 1-3 = tier level
    };
    this.powerupSpawnTimer = 0;
    this.powerupSpawnInterval = 600;  // 10 seconds at 60fps

    // Fire rings moved to ParticleSystem

    // Pending bullets for sequential spawn (ChargeShot II)
    this.pendingBullets = [];

    // Screen flash for tier 3 charging
    this.screenFlash = 0;

    // Beams for ChargeShot III
    this.beams = [];
    // beamParticles moved to ParticleSystem

    // Intro animation state
    this.introTimer = 0;
    // introParticles moved to ParticleSystem
    this.introTextAlpha = 0;

    // Asteroid fade-in after intro
    this.asteroidFadeAlpha = 255;  // Start fully visible (normal gameplay)

    // Homing targeting
    this.targetedAsteroid = null;
    this.targetPoint = null;
    this.lockedTargets = [];  // Homing III: Array of {asteroid, point}

    // UI Renderer
    this.ui = new UIRenderer(this);

    // Collision Manager
    this.collisions = new CollisionManager(this);
  }

  init() {
    this.ship = new Ship(width / 2, height / 2);
    this.state = GameState.INTRO;
    this.introTimer = 0;
    this.particleSystem.introParticles = [];
    this.introTextAlpha = 0;
    // Don't spawn asteroids yet - wait for intro to complete
  }

  spawnInitialAsteroids() {
    // Spawn one of each section type (on screen)
    for (let type of this.sectionTypes) {
      this.asteroids.push(Asteroid.spawnOnScreen(type));
    }
    // Spawn extra neutral asteroids (on screen)
    for (let i = 0; i < 4; i++) {
      this.asteroids.push(Asteroid.spawnOnScreen('neutral'));
    }
  }

  update() {
    if (this.state === GameState.INTRO) {
      this.updateIntro();
    } else if (this.state === GameState.PLAYING) {
      this.updatePlaying();
    } else if (this.state === GameState.TRANSITIONING) {
      this.updateTransition();
    } else if (this.state === GameState.DEAD) {
      this.updateDeath();
    }
    // SECTION state - game paused, handled by DOM
  }

  updateIntro() {
    this.introTimer++;

    // Phase 1: Expanding halo (frames 0-30)
    if (this.introTimer <= 30 && this.introTimer % 2 === 0) {
      // Spawn ring of gray particles
      for (let i = 0; i < 12; i++) {
        let angle = (TWO_PI / 12) * i + random(-0.1, 0.1);
        let speed = 3 + random(0, 1);
        this.particleSystem.introParticles.push({
          pos: this.ship.pos.copy(),
          vel: p5.Vector.fromAngle(angle).mult(speed),
          life: 60,
          maxLife: 60,
          size: random(3, 6)
        });
      }
    }

    // Update particles
    for (let i = this.particleSystem.introParticles.length - 1; i >= 0; i--) {
      let p = this.particleSystem.introParticles[i];
      p.pos.add(p.vel);
      p.vel.mult(0.98);  // Slow down
      p.life--;
      if (p.life <= 0) this.particleSystem.introParticles.splice(i, 1);
    }

    // Phase 2: Text fade in (frames 72-92)
    if (this.introTimer > 72 && this.introTimer <= 92) {
      this.introTextAlpha = map(this.introTimer, 72, 92, 0, 255);
    }

    // Phase 3: Text visible (frames 92-132)
    if (this.introTimer > 92 && this.introTimer <= 132) {
      this.introTextAlpha = 255;
    }

    // Phase 4: Text fade out (frames 132-157)
    if (this.introTimer > 132 && this.introTimer <= 157) {
      this.introTextAlpha = map(this.introTimer, 132, 157, 255, 0);
    }

    // Phase 5: Spawn asteroids and start game
    if (this.introTimer > 157) {
      this.spawnInitialAsteroids();
      this.asteroidFadeAlpha = 0;  // Start faded out
      this.state = GameState.PLAYING;
    }
  }

  updatePlaying() {
    // Fade in asteroids after intro
    if (this.asteroidFadeAlpha < 255) {
      this.asteroidFadeAlpha = min(255, this.asteroidFadeAlpha + 5);
    }

    // Update ship
    this.handleInput();
    this.ship.update();

    // Update Homing targeting
    if (this.activePowerups.homing >= 1 && this.spaceHeld) {
      let facingAsteroid = this.getAsteroidInFacingDirection();

      if (this.activePowerups.homing >= 3) {
        // Homing III: Multi-target lock (up to 3)
        if (facingAsteroid && this.lockedTargets.length < 3) {
          // Check if not already locked
          let alreadyLocked = this.lockedTargets.some(t => t.asteroid === facingAsteroid);
          if (!alreadyLocked) {
            this.lockedTargets.push({
              asteroid: facingAsteroid,
              point: this.getTargetPointOnAsteroid(facingAsteroid)
            });
          }
        }
        // Update target points for locked asteroids (they move)
        for (let target of this.lockedTargets) {
          target.point = this.getTargetPointOnAsteroid(target.asteroid);
        }
        // Also show current facing target (for aiming indicator)
        this.targetedAsteroid = facingAsteroid;
        this.targetPoint = facingAsteroid ? this.getTargetPointOnAsteroid(facingAsteroid) : null;
      } else {
        // Homing I/II: Single target (existing behavior)
        this.targetedAsteroid = facingAsteroid;
        this.targetPoint = facingAsteroid ? this.getTargetPointOnAsteroid(facingAsteroid) : null;
      }
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].update(this.activePowerups.homing > 0 ? this.asteroids : []);
      if (this.bullets[i].isDead()) {
        this.bullets.splice(i, 1);
      }
    }

    // Update asteroids
    for (let asteroid of this.asteroids) {
      asteroid.update();
    }

    // Update particles
    this.updateParticles();

    // Update charging
    this.updateCharging();

    // Update fire rings
    this.updateFireRings();

    // Update pending bullets (sequential spawn for ChargeShot II)
    this.updatePendingBullets();

    // Update beams (ChargeShot III)
    this.updateBeams();
    this.updateBeamParticles();

    // Check collisions via manager
    this.collisions.checkBulletAsteroid();
    this.collisions.checkBeamAsteroid();
    this.collisions.checkShipAsteroid();

    // Update portals and check if ship enters one
    this.updatePortals();
    this.collisions.checkPortal();

    // Update powerups
    this.updatePowerups();
    this.updatePowerupDrops();
    this.collisions.checkBulletPowerup();
    this.collisions.checkShipPowerupDrop();
    this.managePowerups();

    // Spawn new asteroids if needed
    this.manageAsteroids();
  }

  handleInput() {
    if (keyIsDown(LEFT_ARROW)) {
      this.ship.turn(-1);
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.ship.turn(1);
    }
    if (keyIsDown(UP_ARROW)) {
      this.ship.thrust();
    }
  }

  shipDeath() {
    let shipPos = this.ship.pos.copy();
    let shipColor = PALETTE.ship;

    // Create debris particles (ship fragments)
    for (let i = 0; i < 40; i++) {
      let angle = random(TWO_PI);
      let speed = random(1, 4);
      this.particleSystem.shipDebris.push({
        pos: shipPos.copy(),
        vel: p5.Vector.fromAngle(angle).mult(speed),
        life: random(60, 120),
        maxLife: 120,
        color: shipColor,
        size: random(3, 8),
        rotation: random(TWO_PI),
        rotSpeed: random(-0.2, 0.2)
      });
    }

    // Create initial pulsing rings
    for (let i = 0; i < 5; i++) {
      this.particleSystem.deathRings.push({
        pos: shipPos.copy(),
        radius: 10,
        maxRadius: 200 + i * 60,
        speed: 3 + i * 0.5,
        alpha: 255,
        delay: i * 10  // Stagger the rings
      });
    }

    this.ship = null;
    this.state = GameState.DEAD;
    this.shipDeathTimer = 0;

    // Reset all powerups on death
    this.activePowerups.homing = 0;
    this.activePowerups.chargeshot = 0;

    // Clear targeting state
    this.targetedAsteroid = null;
    this.targetPoint = null;
    this.lockedTargets = [];

    // Clear pending bullets
    this.pendingBullets = [];
  }

  updateDeath() {
    this.shipDeathTimer++;

    // Update debris particles
    for (let i = this.particleSystem.shipDebris.length - 1; i >= 0; i--) {
      let d = this.particleSystem.shipDebris[i];
      d.pos.add(d.vel);
      d.vel.mult(0.98);
      d.rotation += d.rotSpeed;
      d.life--;
      if (d.life <= 0) {
        this.particleSystem.shipDebris.splice(i, 1);
      }
    }

    // Update pulsing rings
    for (let i = this.particleSystem.deathRings.length - 1; i >= 0; i--) {
      let ring = this.particleSystem.deathRings[i];
      if (ring.delay > 0) {
        ring.delay--;
        continue;
      }
      ring.radius += ring.speed;
      ring.alpha = map(ring.radius, 10, ring.maxRadius, 255, 0);
      if (ring.radius >= ring.maxRadius) {
        this.particleSystem.deathRings.splice(i, 1);
      }
    }

    // Update asteroids (keep them moving)
    for (let asteroid of this.asteroids) {
      asteroid.update();
    }

    // Respawn after delay
    if (this.shipDeathTimer >= this.shipRespawnDelay) {
      this.respawnShip();
    }
  }

  respawnShip() {
    this.ship = new Ship(width / 2, height / 2);
    this.state = GameState.PLAYING;
    this.particleSystem.shipDebris = [];
    this.particleSystem.deathRings = [];

    // Clear nearby asteroids to give player breathing room
    this.asteroids = this.asteroids.filter(a => {
      let d = dist(a.pos.x, a.pos.y, width / 2, height / 2);
      return d > 200;
    });
  }

  updateParticles() {
    for (let i = this.particleSystem.particles.length - 1; i >= 0; i--) {
      let p = this.particleSystem.particles[i];
      p.pos.add(p.vel);
      p.vel.mult(0.98);  // Slow down
      p.life--;
      if (p.life <= 0) {
        this.particleSystem.particles.splice(i, 1);
      }
    }
  }

  updatePortals() {
    for (let i = this.portals.length - 1; i >= 0; i--) {
      let portal = this.portals[i];
      portal.life--;
      if (portal.life <= 0) {
        this.portals.splice(i, 1);
      }
    }
  }

  manageAsteroids() {
    this.spawnTimer++;

    // Keep spawning asteroids
    if (this.spawnTimer >= this.spawnInterval && this.asteroids.length < this.maxAsteroids) {
      // Count current asteroids by type
      let typeCounts = { work: 0, about: 0, resume: 0, neutral: 0 };
      for (let a of this.asteroids) {
        typeCounts[a.type]++;
      }

      // Ensure at least one of each section type exists
      let missingSection = this.sectionTypes.find(t => typeCounts[t] === 0);

      let spawnType;
      if (missingSection) {
        // Spawn missing section type
        spawnType = missingSection;
      } else if (random() < 0.6) {
        // 60% chance to spawn neutral
        spawnType = 'neutral';
      } else {
        // 40% chance to spawn a random section type
        spawnType = random(this.sectionTypes);
      }

      this.asteroids.push(Asteroid.spawnFromEdge(spawnType));
      this.spawnTimer = 0;
    }
  }

  // Powerup methods
  updatePowerups() {
    for (let powerup of this.powerups) {
      powerup.update();
    }
  }

  updatePowerupDrops() {
    for (let i = this.powerupDrops.length - 1; i >= 0; i--) {
      this.powerupDrops[i].update();
      if (this.powerupDrops[i].isDead()) {
        this.powerupDrops.splice(i, 1);
      }
    }
  }

  activatePowerup(type) {
    switch (type) {
      case 'homing':
        // Clear other powerup types
        this.activePowerups.chargeshot = 0;
        if (this.activePowerups.homing < 3) {
          this.activePowerups.homing++;
        }
        break;
      case 'chargeshot':
        // Clear other powerup types
        this.activePowerups.homing = 0;
        this.lockedTargets = [];
        if (this.activePowerups.chargeshot < 3) {
          this.activePowerups.chargeshot++;
        }
        break;
    }
  }

  managePowerups() {
    this.powerupSpawnTimer++;

    // Spawn powerup periodically
    if (this.powerupSpawnTimer >= this.powerupSpawnInterval && this.powerups.length < 2) {
      // Randomly spawn homing or chargeshot
      let types = ['homing', 'chargeshot'];
      let type = random(types);
      this.powerups.push(Powerup.spawnFromEdge(type));
      this.powerupSpawnTimer = 0;
    }
  }

  // Homing II targeting methods
  getAsteroidInFacingDirection() {
    if (!this.ship || this.asteroids.length === 0) return null;

    let shipDir = p5.Vector.fromAngle(this.ship.rotation);
    let closestAsteroid = null;
    let closestDot = 0.5;  // cos(60°) = 0.5, only asteroids within 60° cone

    for (let asteroid of this.asteroids) {
      let toAsteroid = p5.Vector.sub(asteroid.pos, this.ship.pos);
      toAsteroid.normalize();

      let dot = shipDir.dot(toAsteroid);
      // dot > 0 = in front, dot > 0.5 = within 60° cone
      // Find the one most directly in front (highest dot product)
      if (dot > closestDot) {
        closestDot = dot;
        closestAsteroid = asteroid;
      }
    }
    return closestAsteroid;
  }

  getTargetPointOnAsteroid(asteroid) {
    // Point on asteroid border facing the ship
    let toAsteroid = p5.Vector.sub(asteroid.pos, this.ship.pos);
    let hitAngle = atan2(toAsteroid.y, toAsteroid.x);

    let borderPoint = createVector(
      asteroid.pos.x - cos(hitAngle) * asteroid.radius,
      asteroid.pos.y - sin(hitAngle) * asteroid.radius
    );
    return borderPoint;
  }

  // Pathfinding for Homing II
  calculatePathToTarget(start, end, targetAsteroid, depth = 0) {
    // Prevent infinite recursion
    if (depth > 10) {
      return [start, end];
    }

    // Find blocking asteroids (exclude target asteroid)
    let obstacles = this.asteroids.filter(a => a !== targetAsteroid);

    // Check if direct path is blocked
    let blocking = this.getBlockingAsteroid(start, end, obstacles);

    if (!blocking) {
      // Direct path is clear
      return [start, end];
    }

    // Path is blocked - calculate waypoint around obstacle
    let waypoint = this.getAvoidanceWaypoint(start, end, blocking);

    // Recursively find path: start → waypoint → end
    let pathToWaypoint = this.calculatePathToTarget(start, waypoint, targetAsteroid, depth + 1);
    let pathFromWaypoint = this.calculatePathToTarget(waypoint, end, targetAsteroid, depth + 1);

    // Combine paths (remove duplicate waypoint)
    return [...pathToWaypoint, ...pathFromWaypoint.slice(1)];
  }

  getBlockingAsteroid(start, end, obstacles) {
    // Return first asteroid that intersects line segment start→end
    for (let asteroid of obstacles) {
      if (this.lineIntersectsCircle(start, end, asteroid.pos, asteroid.radius + 10)) {
        return asteroid;
      }
    }
    return null;
  }

  lineIntersectsCircle(lineStart, lineEnd, circleCenter, radius) {
    // Vector from line start to circle center
    let d = p5.Vector.sub(lineEnd, lineStart);
    let f = p5.Vector.sub(lineStart, circleCenter);

    let a = d.dot(d);
    let b = 2 * f.dot(d);
    let c = f.dot(f) - radius * radius;

    let discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return false;  // No intersection
    }

    discriminant = sqrt(discriminant);
    let t1 = (-b - discriminant) / (2 * a);
    let t2 = (-b + discriminant) / (2 * a);

    // Check if intersection is within line segment (0 <= t <= 1)
    if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
      return true;
    }

    // Check if line segment is entirely inside circle
    if (t1 < 0 && t2 > 1) {
      return true;
    }

    return false;
  }

  getAvoidanceWaypoint(start, end, asteroid) {
    // Calculate point that routes around asteroid
    let toAsteroid = p5.Vector.sub(asteroid.pos, start);
    let toEnd = p5.Vector.sub(end, start);

    // Get perpendicular direction
    let perpendicular = createVector(-toAsteroid.y, toAsteroid.x);
    perpendicular.normalize();

    // Determine which side is closer to the end point
    let testPoint1 = p5.Vector.add(asteroid.pos, p5.Vector.mult(perpendicular, asteroid.radius + 30));
    let testPoint2 = p5.Vector.sub(asteroid.pos, p5.Vector.mult(perpendicular, asteroid.radius + 30));

    let dist1 = p5.Vector.dist(testPoint1, end);
    let dist2 = p5.Vector.dist(testPoint2, end);

    // Choose the side that's closer to the destination
    return dist1 < dist2 ? testPoint1 : testPoint2;
  }

  spawnPortal(pos, type) {
    this.portals.push({
      pos: pos.copy(),
      type: type,
      radius: 40,
      life: 300,          // 5 seconds at 60fps
      maxLife: 300,
      color: PALETTE.asteroids[type]
    });
  }

  triggerTransition(sectionType) {
    this.currentSection = sectionType;
    this.state = GameState.TRANSITIONING;
    this.fadeDirection = 1;  // Fade out
    this.fadeAlpha = 0;
  }

  updateTransition() {
    if (this.fadeDirection === 1) {
      // Fading out
      this.fadeAlpha += 15;
      if (this.fadeAlpha >= 255) {
        this.fadeAlpha = 255;
        this.showSection();
      }
    } else if (this.fadeDirection === -1) {
      // Fading in (returning to game)
      this.fadeAlpha -= 15;
      if (this.fadeAlpha <= 0) {
        this.fadeAlpha = 0;
        this.state = GameState.PLAYING;
        this.fadeDirection = 0;
      }
    }
  }

  showSection() {
    this.state = GameState.SECTION;
    let overlay = document.getElementById('section-overlay');
    let inner = document.getElementById('section-inner');

    // Get section content
    let content = '';
    switch (this.currentSection) {
      case 'work':
        content = WorkSection.render();
        break;
      case 'about':
        content = AboutSection.render();
        break;
      case 'resume':
        content = ResumeSection.render();
        break;
    }

    inner.innerHTML = content;
    overlay.classList.remove('hidden');
    overlay.classList.add('visible');
  }

  returnToGame() {
    let overlay = document.getElementById('section-overlay');
    overlay.classList.remove('visible');
    overlay.classList.add('hidden');

    this.state = GameState.TRANSITIONING;
    this.fadeDirection = -1;  // Fade in
  }

  startCharging() {
    if (this.state === GameState.PLAYING && this.ship) {
      // Homing II: Start targeting mode
      if (this.activePowerups.homing >= 1) {
        this.spaceHeld = true;
        this.spaceHoldTime = 0;
        return;
      }

      // Homing I or no powerup: fire normal bullet immediately
      if (this.activePowerups.chargeshot === 0) {
        this.bullets.push(this.ship.fire());
        return;
      }

      // Chargeshot: start charging
      this.spaceHeld = true;
      this.spaceHoldTime = 0;
    }
  }

  releaseCharge() {
    if (this.state !== GameState.PLAYING || !this.ship) {
      this.spaceHeld = false;
      this.isCharging = false;
      this.targetedAsteroid = null;
      this.targetPoint = null;
      this.lockedTargets = [];
      return;
    }

    // Homing: Fire guided bullet(s) that arc to target(s)
    if (this.activePowerups.homing >= 1) {
      // Homing III: Fire at all locked targets
      if (this.activePowerups.homing >= 3 && this.lockedTargets.length > 0) {
        for (let target of this.lockedTargets) {
          let bullet = this.ship.fire();
          bullet.isHomingII = true;  // Gets ricochet too
          bullet.homingTier = 3;  // Homing III
          bullet.vel.mult(1.6);
          bullet.scale = 1.3;
          bullet.radius = SHAPES.bullet.radius * bullet.scale;
          bullet.setGuidedTarget(bullet.pos, target.asteroid, this.asteroids);
          this.bullets.push(bullet);
        }
        this.lockedTargets = [];
      } else if (this.targetedAsteroid) {
        // Homing I/II: Single target
        let bullet = this.ship.fire();

        // Homing II+: Mark for ricochet on impact and store tier
        if (this.activePowerups.homing >= 2) {
          bullet.isHomingII = true;
          bullet.homingTier = this.activePowerups.homing;
        }

        // Make homing bullet faster and slightly larger (Homing II is a bit faster)
        let speedMult = bullet.isHomingII ? 1.6 : 1.5;
        bullet.vel.mult(speedMult);
        bullet.scale = 1.3;
        bullet.radius = SHAPES.bullet.radius * bullet.scale;

        // Set up guided path - bullet tracks the asteroid dynamically
        bullet.setGuidedTarget(bullet.pos, this.targetedAsteroid, this.asteroids);

        this.bullets.push(bullet);
      } else {
        // No target, fire normal bullet
        this.bullets.push(this.ship.fire());
      }
      this.targetedAsteroid = null;
      this.targetPoint = null;
      this.lockedTargets = [];
      this.spaceHeld = false;
      return;
    }

    // If no chargeshot powerup, do nothing (already fired on press)
    if (this.activePowerups.chargeshot === 0) {
      return;
    }

    let tier = this.activePowerups.chargeshot;

    if (this.isCharging) {
      if (tier >= 3) {
        // Tier 3: Fire beam instead of bullets
        this.fireBeam();
      } else if (tier >= 2) {
        // Tier 2: Fire first bullet immediately, queue rest
        let firstBullet = this.ship.fireCharged(this.chargeLevel, this.maxChargeLevel, tier);
        this.bullets.push(firstBullet);

        // Queue remaining bullets with delay based on spacing/speed
        let bulletSpeed = firstBullet.vel.mag();
        let spacing = 40;
        let frameDelay = spacing / bulletSpeed;

        for (let i = 1; i < 3; i++) {
          this.pendingBullets.push({
            delay: frameDelay * i,
            chargeLevel: this.chargeLevel,
            maxChargeLevel: this.maxChargeLevel,
            tier: tier
          });
        }

        // Muzzle flash and fire ring
        this.ship.emitTier2MuzzleFlash(this.ship.getNosePosition(), this.chargeLevel / this.maxChargeLevel);
        this.spawnFireRing(this.ship.getNosePosition());
      } else {
        // Tier 1: single bullet
        let bullet = this.ship.fireCharged(this.chargeLevel, this.maxChargeLevel, tier);
        this.bullets.push(bullet);
      }
    } else if (this.spaceHeld) {
      // Quick tap - fire normal bullet
      this.bullets.push(this.ship.fire());
    }

    // Reset all charging state
    this.spaceHeld = false;
    this.spaceHoldTime = 0;
    this.isCharging = false;
    this.chargeLevel = 0;
    this.particleSystem.chargeParticles = [];
  }

  updateCharging() {
    if (!this.ship) return;

    // Skip charging effects during Homing II targeting
    if (this.activePowerups.homing >= 1) return;

    // Track how long space has been held
    if (this.spaceHeld && !this.isCharging) {
      this.spaceHoldTime++;
      // Start charging after threshold
      if (this.spaceHoldTime >= this.chargeThreshold) {
        this.isCharging = true;
      }
    }

    // Only proceed with charging effects if actually charging
    if (!this.isCharging) return;

    // Increment charge level
    if (this.chargeLevel < this.maxChargeLevel) {
      this.chargeLevel++;
    }

    // Get ship nose position for particles
    let nosePos = this.ship.getNosePosition();
    let chargePercent = this.chargeLevel / this.maxChargeLevel;
    let tier = this.activePowerups.chargeshot;

    // Tier-based spawn parameters
    let baseSpawnRate = 1 + floor(chargePercent * 3);  // 1-4 particles per frame
    let spawnRate = tier >= 3 ? baseSpawnRate + 3 : (tier >= 2 ? baseSpawnRate + 2 : baseSpawnRate);
    let minDistance = tier >= 3 ? 110 : (tier >= 2 ? 100 : 80);
    let maxDistance = tier >= 3 ? 160 : (tier >= 2 ? 150 : 120);
    let particleSize = tier >= 3 ? random(3, 5.5) : (tier >= 2 ? random(2.5, 5) : random(2, 4));

    for (let i = 0; i < spawnRate; i++) {
      // Spawn in a ring around the ship
      let angle = random(TWO_PI);
      let distance = random(minDistance, maxDistance);
      let spawnPos = createVector(
        nosePos.x + cos(angle) * distance,
        nosePos.y + sin(angle) * distance
      );

      // Calculate velocity toward nose
      let toNose = p5.Vector.sub(nosePos, spawnPos);
      let speed = 3 + chargePercent * 4;  // Faster as charge increases
      toNose.setMag(speed);

      // Particle color based on tier
      let isCyan = false;
      let isMagenta = false;
      if (tier >= 3) {
        // Tier 3: ~30% magenta, ~30% cyan, ~40% white
        let colorRoll = random();
        if (colorRoll < 0.3) isMagenta = true;
        else if (colorRoll < 0.6) isCyan = true;
      } else if (tier >= 2) {
        isCyan = random() < 0.4;
      }

      this.particleSystem.chargeParticles.push({
        pos: spawnPos,
        vel: toNose,
        target: nosePos.copy(),
        life: 30,
        maxLife: 30,
        size: particleSize,
        isCyan: isCyan,
        isMagenta: isMagenta
      });
    }

    // Update charge particles
    for (let i = this.particleSystem.chargeParticles.length - 1; i >= 0; i--) {
      let p = this.particleSystem.chargeParticles[i];

      // Update target to current nose position (ship might move)
      p.target = this.ship.getNosePosition();

      // Steer toward target
      let toTarget = p5.Vector.sub(p.target, p.pos);
      if (toTarget.mag() < 10) {
        // Close enough, remove particle
        this.particleSystem.chargeParticles.splice(i, 1);
        continue;
      }
      toTarget.setMag(p.vel.mag() * 1.05);  // Accelerate slightly
      p.vel = toTarget;

      p.pos.add(p.vel);
      p.life--;

      if (p.life <= 0) {
        this.particleSystem.chargeParticles.splice(i, 1);
      }
    }

    // Tier 3 screen flash effect
    if (tier >= 3) {
      this.screenFlash = sin(frameCount * 0.3) * 20 * chargePercent;
    } else {
      this.screenFlash = 0;
    }
  }

  spawnFireRing(pos) {
    this.particleSystem.fireRings.push({
      pos: pos.copy(),
      radius: 5,
      maxRadius: 60,
      speed: 4,
      alpha: 200
    });
  }

  updateFireRings() {
    for (let i = this.particleSystem.fireRings.length - 1; i >= 0; i--) {
      let ring = this.particleSystem.fireRings[i];
      ring.radius += ring.speed;
      ring.alpha = map(ring.radius, 5, ring.maxRadius, 200, 0);
      if (ring.radius >= ring.maxRadius) {
        this.particleSystem.fireRings.splice(i, 1);
      }
    }
  }

  updatePendingBullets() {
    for (let i = this.pendingBullets.length - 1; i >= 0; i--) {
      this.pendingBullets[i].delay--;
      if (this.pendingBullets[i].delay <= 0 && this.ship) {
        let pb = this.pendingBullets[i];
        let bullet = this.ship.fireCharged(pb.chargeLevel, pb.maxChargeLevel, pb.tier);
        this.bullets.push(bullet);
        this.pendingBullets.splice(i, 1);
      }
    }
  }

  fireBeam() {
    let nosePos = this.ship.getNosePosition();
    let direction = p5.Vector.fromAngle(this.ship.rotation);
    let chargePercent = this.chargeLevel / this.maxChargeLevel;

    // Beam properties scale with charge level
    let maxLength = 400 + chargePercent * 1100;  // 400-1500
    let beamWidth = 30 + chargePercent * 50;     // 30-80
    let beamLife = 25 + chargePercent * 20;      // 25-45

    this.beams.push({
      startPos: nosePos.copy(),
      direction: direction.copy(),
      currentLength: 0,
      maxLength: maxLength,
      extendSpeed: 50,
      width: beamWidth,
      life: beamLife,
      maxLife: beamLife,
      extending: true,
      chargePercent: chargePercent  // Store for particle/helix logic
    });

    // Muzzle flash and fire ring
    this.ship.emitTier3MuzzleFlash(nosePos, chargePercent);
    this.spawnFireRing(nosePos);
  }

  updateBeams() {
    for (let i = this.beams.length - 1; i >= 0; i--) {
      let beam = this.beams[i];

      // Extend beam until max length
      if (beam.extending) {
        beam.currentLength += beam.extendSpeed;
        if (beam.currentLength >= beam.maxLength) {
          beam.currentLength = beam.maxLength;
          beam.extending = false;
        }
      }

      // Spawn particles along beam length - count scales with charge
      if (beam.currentLength > 10) {
        let endPos = p5.Vector.add(beam.startPos, p5.Vector.mult(beam.direction, beam.currentLength));
        let particleCount = floor(2 + beam.chargePercent * 6);  // 2-8 particles

        for (let j = 0; j < particleCount; j++) {
          let t = random();  // Random position along beam (0-1)
          let pos = p5.Vector.lerp(beam.startPos, endPos, t);

          // Perpendicular offset for particle spawn
          let perpAngle = atan2(beam.direction.y, beam.direction.x) + HALF_PI;
          let offset = random(-beam.width * 0.5, beam.width * 0.5);
          pos.x += cos(perpAngle) * offset;
          pos.y += sin(perpAngle) * offset;

          // Velocity perpendicular to beam (outward drift)
          let vel = p5.Vector.fromAngle(perpAngle + random(-0.5, 0.5));
          vel.mult(random(1.5, 4));

          // Determine color type - include green
          let colorTypes = ['magenta', 'magenta', 'green', 'green', 'cyan', 'cyan', 'white', 'white'];
          let colorType = random(colorTypes);

          this.particleSystem.beamParticles.push({
            pos: pos,
            vel: vel,
            life: random(15, 30),
            maxLife: 30,
            size: random(3, 7),
            colorType: colorType
          });
        }

        // Spawn particles along helix paths - only at full charge
        if (beam.chargePercent >= 0.95) {
          let helixRadius = beam.width * 0.6;
          let helixFrequency = 0.08;
          let helixRotation = frameCount * 0.15;

          for (let k = 0; k < 2; k++) {
            let phaseOffset = k * PI;
            let t = random();
            let dist = t * beam.currentLength;

            // Base position along beam
            let baseX = beam.startPos.x + beam.direction.x * dist;
            let baseY = beam.startPos.y + beam.direction.y * dist;

            // Perpendicular angle and helix position
            let perpAngle = atan2(beam.direction.y, beam.direction.x) + HALF_PI;
            let helixAngle = dist * helixFrequency + helixRotation + phaseOffset;

            // Position on helix
            let offsetMag = sin(helixAngle) * helixRadius;
            let helixPos = createVector(
              baseX + cos(perpAngle) * offsetMag,
              baseY + sin(perpAngle) * offsetMag
            );

            // Velocity outward from helix
            let outwardAngle = perpAngle + (offsetMag > 0 ? 0 : PI);
            let vel = p5.Vector.fromAngle(outwardAngle + random(-0.3, 0.3));
            vel.mult(random(2, 5));

            // Helix particles are cyan or magenta based on which helix
            let colorType = k === 0 ? 'cyan' : 'magenta';

            this.particleSystem.beamParticles.push({
              pos: helixPos,
              vel: vel,
              life: random(15, 25),
              maxLife: 25,
              size: random(2, 5),
              colorType: colorType
            });
          }
        }
      }

      beam.life--;
      if (beam.life <= 0) {
        this.beams.splice(i, 1);
      }
    }
  }

  renderBeams() {
    for (let beam of this.beams) {
      let alpha = map(beam.life, 0, beam.maxLife, 0, 255);
      let endPos = p5.Vector.add(beam.startPos, p5.Vector.mult(beam.direction, beam.currentLength));

      // Intense shimmer effect - faster oscillation, bigger range
      let shimmer1 = 0.8 + sin(frameCount * 0.6) * 0.2;
      let shimmer2 = 0.8 + sin(frameCount * 0.6 + PI * 0.33) * 0.2;
      let shimmer3 = 0.8 + sin(frameCount * 0.6 + PI * 0.66) * 0.2;
      let shimmer4 = 0.8 + sin(frameCount * 0.6 + PI) * 0.2;

      push();
      strokeCap(ROUND);

      // Outer layer - magenta glow
      stroke(255, 0, 255, alpha * 0.4 * shimmer1);
      strokeWeight(beam.width);
      line(beam.startPos.x, beam.startPos.y, endPos.x, endPos.y);

      // Green layer (outer)
      stroke(0, 255, 100, alpha * 0.5 * shimmer2);
      strokeWeight(beam.width * 0.75);
      line(beam.startPos.x, beam.startPos.y, endPos.x, endPos.y);

      // Cyan layer
      stroke(0, 255, 255, alpha * 0.7 * shimmer3);
      strokeWeight(beam.width * 0.55);
      line(beam.startPos.x, beam.startPos.y, endPos.x, endPos.y);

      // Green layer (inner) - more green!
      stroke(0, 255, 100, alpha * 0.8 * shimmer4);
      strokeWeight(beam.width * 0.4);
      line(beam.startPos.x, beam.startPos.y, endPos.x, endPos.y);

      // White core
      stroke(255, 255, 255, alpha);
      strokeWeight(beam.width * 0.2);
      line(beam.startPos.x, beam.startPos.y, endPos.x, endPos.y);

      // Draw helix spirals around beam - only at full charge
      if (beam.chargePercent >= 0.95) {
        let helixRadius = beam.width * 0.6;
        let helixFrequency = 0.08;
        let helixRotation = frameCount * 0.15;
        let numPoints = floor(beam.currentLength / 8);

        if (numPoints > 2) {
          for (let k = 0; k < 2; k++) {
            let phaseOffset = k * PI;
            let helixColor = k === 0 ? [0, 255, 255] : [255, 0, 255];  // Cyan and magenta helixes

            beginShape();
            noFill();
            stroke(helixColor[0], helixColor[1], helixColor[2], alpha * 0.8 * shimmer1);
            strokeWeight(3);

            for (let i = 0; i <= numPoints; i++) {
              let t = i / numPoints;
              let dist = t * beam.currentLength;

              // Base position along beam
              let baseX = beam.startPos.x + beam.direction.x * dist;
              let baseY = beam.startPos.y + beam.direction.y * dist;

              // Perpendicular angle to beam direction
              let perpAngle = atan2(beam.direction.y, beam.direction.x) + HALF_PI;
              let helixAngle = dist * helixFrequency + helixRotation + phaseOffset;

              // Helix offset (sine wave in perpendicular direction)
              let offsetMag = sin(helixAngle) * helixRadius;
              let offsetX = cos(perpAngle) * offsetMag;
              let offsetY = sin(perpAngle) * offsetMag;

              vertex(baseX + offsetX, baseY + offsetY);
            }
            endShape();
          }
        }
      }
      pop();
    }
  }

  updateBeamParticles() {
    for (let i = this.particleSystem.beamParticles.length - 1; i >= 0; i--) {
      let p = this.particleSystem.beamParticles[i];
      p.pos.add(p.vel);
      p.vel.mult(0.95);  // Slow down
      p.life--;
      if (p.life <= 0) {
        this.particleSystem.beamParticles.splice(i, 1);
      }
    }
  }

  renderBeamParticles() {
    for (let p of this.particleSystem.beamParticles) {
      let alpha = map(p.life, 0, p.maxLife, 0, 255);
      noStroke();

      // Color based on type
      let r, g, b;
      if (p.colorType === 'magenta') {
        r = 255; g = 0; b = 255;
      } else if (p.colorType === 'green') {
        r = 0; g = 255; b = 100;  // Neon green from ChargeShot I
      } else if (p.colorType === 'cyan') {
        r = 0; g = 255; b = 255;
      } else {
        r = 255; g = 255; b = 255;
      }

      // Outer glow
      fill(r, g, b, alpha * 0.3);
      ellipse(p.pos.x, p.pos.y, p.size * 3, p.size * 3);

      // Core
      fill(r, g, b, alpha);
      ellipse(p.pos.x, p.pos.y, p.size, p.size);

      // White center
      fill(255, 255, 255, alpha * 0.5);
      ellipse(p.pos.x, p.pos.y, p.size * 0.4, p.size * 0.4);
    }
  }

  renderFireRings() {
    for (let ring of this.particleSystem.fireRings) {
      noFill();
      stroke(0, 255, 255, ring.alpha);
      strokeWeight(2);
      ellipse(ring.pos.x, ring.pos.y, ring.radius * 2, ring.radius * 2);
    }
  }

  renderTargetingCrosshair() {
    if (this.activePowerups.homing < 1) return;

    let pulse = sin(frameCount * 0.2) * 0.3 + 0.7;  // 0.4-1.0 pulsing

    // Draw locked targets (Homing III) - solid red, larger
    for (let target of this.lockedTargets) {
      let size = 18;
      push();
      stroke(255, 50, 50, 255);  // Solid red (locked)
      strokeWeight(3);
      noFill();
      let x = target.point.x;
      let y = target.point.y;
      line(x - size, y, x + size, y);
      line(x, y - size, x, y + size);
      ellipse(x, y, size * 2, size * 2);
      pop();
    }

    // Draw current target (pulsing, thinner - "aiming")
    if (this.targetPoint) {
      // Skip if already locked
      let isLocked = this.lockedTargets.some(t => t.asteroid === this.targetedAsteroid);
      if (!isLocked) {
        let size = 15 * pulse;
        push();
        stroke(255, 0, 0, 200 * pulse);
        strokeWeight(2);
        noFill();
        let x = this.targetPoint.x;
        let y = this.targetPoint.y;
        line(x - size, y, x + size, y);
        line(x, y - size, x, y + size);
        ellipse(x, y, size * 2, size * 2);
        pop();
      }
    }
  }

  // DEBUG: Render bezier curves for guided bullets
  renderGuidedPaths() {
    for (let bullet of this.bullets) {
      if (bullet.guidedStart && bullet.guidedControl && bullet.guidedEnd) {
        push();

        // Draw the full bezier curve (yellow)
        stroke(255, 255, 0, 150);
        strokeWeight(2);
        noFill();
        beginShape();
        for (let t = 0; t <= 1; t += 0.05) {
          let mt = 1 - t;
          let x = mt * mt * bullet.guidedStart.x + 2 * mt * t * bullet.guidedControl.x + t * t * bullet.guidedEnd.x;
          let y = mt * mt * bullet.guidedStart.y + 2 * mt * t * bullet.guidedControl.y + t * t * bullet.guidedEnd.y;
          vertex(x, y);
        }
        endShape();

        // Draw control point (magenta)
        fill(255, 0, 255);
        noStroke();
        ellipse(bullet.guidedControl.x, bullet.guidedControl.y, 10, 10);

        // Draw start point (green)
        fill(0, 255, 0);
        ellipse(bullet.guidedStart.x, bullet.guidedStart.y, 8, 8);

        // Draw end point (red)
        fill(255, 0, 0);
        ellipse(bullet.guidedEnd.x, bullet.guidedEnd.y, 8, 8);

        // Draw lines from start to control, control to end (cyan)
        stroke(0, 255, 255, 100);
        strokeWeight(1);
        line(bullet.guidedStart.x, bullet.guidedStart.y, bullet.guidedControl.x, bullet.guidedControl.y);
        line(bullet.guidedControl.x, bullet.guidedControl.y, bullet.guidedEnd.x, bullet.guidedEnd.y);

        // Show current t value
        fill(255);
        noStroke();
        textSize(12);
        text(`t=${bullet.guidedT.toFixed(2)}`, bullet.pos.x + 15, bullet.pos.y - 10);

        pop();
      }
    }
  }

  render() {
    // Handle intro state separately
    if (this.state === GameState.INTRO) {
      this.ui.renderIntro();
      return;
    }

    // Always draw game elements
    background(PALETTE.background);

    // Draw particles with glowing ember effect
    for (let p of this.particleSystem.particles) {
      let alpha = map(p.life, 0, p.maxLife, 0, 255);
      let c = color(p.color);
      let r = red(c), g = green(c), b = blue(c);
      noStroke();

      // Outer glow (large, very transparent)
      fill(r, g, b, alpha * 0.15);
      ellipse(p.pos.x, p.pos.y, p.size * 4, p.size * 4);

      // Middle glow
      fill(r, g, b, alpha * 0.3);
      ellipse(p.pos.x, p.pos.y, p.size * 2.5, p.size * 2.5);

      // Inner glow
      fill(r, g, b, alpha * 0.5);
      ellipse(p.pos.x, p.pos.y, p.size * 1.5, p.size * 1.5);

      // Bright core
      fill(r, g, b, alpha);
      ellipse(p.pos.x, p.pos.y, p.size, p.size);

      // White-hot center
      fill(255, 255, 255, alpha * 0.7);
      ellipse(p.pos.x, p.pos.y, p.size * 0.4, p.size * 0.4);
    }

    // Draw asteroids (with fade-in effect after intro)
    if (this.asteroidFadeAlpha < 255) {
      drawingContext.globalAlpha = this.asteroidFadeAlpha / 255;
    }
    for (let asteroid of this.asteroids) {
      asteroid.render();
    }
    if (this.asteroidFadeAlpha < 255) {
      drawingContext.globalAlpha = 1;  // Reset
    }

    // Draw portals
    this.renderPortals();

    // Draw powerups and drops
    for (let powerup of this.powerups) {
      powerup.render();
    }
    for (let drop of this.powerupDrops) {
      drop.render();
    }

    // Draw bullets
    for (let bullet of this.bullets) {
      bullet.render();
    }

    // Draw beams (ChargeShot III)
    this.renderBeams();
    this.renderBeamParticles();

    // Draw fire rings
    this.renderFireRings();

    // Draw ship
    if (this.ship) {
      this.ship.render();
    }

    // Draw Homing II targeting crosshair
    this.renderTargetingCrosshair();

    // Draw charging effect
    this.renderCharging();

    // Screen flash for tier 3 charging
    if (this.screenFlash > 0) {
      fill(255, 255, 255, this.screenFlash);
      noStroke();
      rect(0, 0, width, height);
    }

    // Draw death effects
    this.ui.renderDeathEffects();

    // Draw fade overlay during transitions
    if (this.state === GameState.TRANSITIONING || this.fadeAlpha > 0) {
      fill(10, 10, 10, this.fadeAlpha);
      noStroke();
      rect(0, 0, width, height);
    }

    // Draw UI when playing or dead
    if (this.state === GameState.PLAYING || this.state === GameState.DEAD) {
      this.ui.drawScore();
      if (this.state === GameState.PLAYING) {
        this.ui.drawInstructions();
      }
    }
  }

  renderCharging() {
    if (!this.isCharging || !this.ship) return;

    let c = color(PALETTE.ship);
    let r = red(c), g = green(c), b = blue(c);
    let chargePercent = this.chargeLevel / this.maxChargeLevel;
    let nosePos = this.ship.getNosePosition();
    let tier = this.activePowerups.chargeshot;

    // Accent colors
    let cyanR = 0, cyanG = 255, cyanB = 255;
    let magentaR = 255, magentaG = 0, magentaB = 255;

    // Draw energy particles flowing inward
    for (let p of this.particleSystem.chargeParticles) {
      let alpha = map(p.life, 0, p.maxLife, 50, 255);
      noStroke();

      // Determine particle color
      let pr, pg, pb;
      if (p.isMagenta) {
        pr = magentaR; pg = magentaG; pb = magentaB;
      } else if (p.isCyan) {
        pr = cyanR; pg = cyanG; pb = cyanB;
      } else {
        pr = r; pg = g; pb = b;
      }

      // Outer glow
      fill(pr, pg, pb, alpha * 0.3);
      ellipse(p.pos.x, p.pos.y, p.size * 3, p.size * 3);

      // Core
      fill(pr, pg, pb, alpha);
      ellipse(p.pos.x, p.pos.y, p.size, p.size);

      // White center
      fill(255, 255, 255, alpha * 0.5);
      ellipse(p.pos.x, p.pos.y, p.size * 0.4, p.size * 0.4);
    }

    // Draw growing orb at ship nose
    let baseSize = 5;
    let maxGrowth = tier >= 3 ? 32 : (tier >= 2 ? 28 : 20);
    let orbSize = baseSize + chargePercent * maxGrowth;
    let pulse = sin(frameCount * 0.2) * 0.2 + 1;  // Pulsing effect

    // Tier 3 magenta accent rings (outermost)
    if (tier >= 3) {
      let magentaPulse = sin(frameCount * 0.12) * 0.35 + 1;
      let magentaPulse2 = sin(frameCount * 0.12 + PI * 0.5) * 0.35 + 1;
      let magentaAlpha = 70 + chargePercent * 100;

      noFill();
      // Outer magenta ring
      stroke(magentaR, magentaG, magentaB, magentaAlpha * 0.4);
      strokeWeight(2.5);
      ellipse(nosePos.x, nosePos.y, orbSize * 6.5 * magentaPulse, orbSize * 6.5 * magentaPulse);

      // Inner magenta ring
      stroke(magentaR, magentaG, magentaB, magentaAlpha * 0.6);
      strokeWeight(1.5);
      ellipse(nosePos.x, nosePos.y, orbSize * 4.5 * magentaPulse2, orbSize * 4.5 * magentaPulse2);
    }

    // Tier 2+ cyan accent rings (pulsing outward)
    if (tier >= 2) {
      let cyanPulse = sin(frameCount * 0.15) * 0.3 + 1;
      let cyanPulse2 = sin(frameCount * 0.15 + PI) * 0.3 + 1;  // Offset phase
      let cyanAlpha = 80 + chargePercent * 100;

      noFill();
      // Outer cyan ring
      stroke(cyanR, cyanG, cyanB, cyanAlpha * 0.4);
      strokeWeight(2);
      ellipse(nosePos.x, nosePos.y, orbSize * 5 * cyanPulse, orbSize * 5 * cyanPulse);

      // Inner cyan ring (offset pulse)
      stroke(cyanR, cyanG, cyanB, cyanAlpha * 0.7);
      strokeWeight(1.5);
      ellipse(nosePos.x, nosePos.y, orbSize * 3.5 * cyanPulse2, orbSize * 3.5 * cyanPulse2);
    }

    // Outer glow
    fill(r, g, b, 50 + chargePercent * 50);
    noStroke();
    ellipse(nosePos.x, nosePos.y, orbSize * 4 * pulse, orbSize * 4 * pulse);

    // Middle glow
    fill(r, g, b, 100 + chargePercent * 100);
    ellipse(nosePos.x, nosePos.y, orbSize * 2.5 * pulse, orbSize * 2.5 * pulse);

    // Tier 3 magenta tint layer
    if (tier >= 3) {
      fill(magentaR, magentaG, magentaB, 20 + chargePercent * 30);
      ellipse(nosePos.x, nosePos.y, orbSize * 2.2 * pulse, orbSize * 2.2 * pulse);
    }

    // Tier 2+ cyan tint in middle layer
    if (tier >= 2) {
      fill(cyanR, cyanG, cyanB, 30 + chargePercent * 40);
      ellipse(nosePos.x, nosePos.y, orbSize * 2 * pulse, orbSize * 2 * pulse);
    }

    // Inner glow
    fill(r, g, b, 180 + chargePercent * 75);
    ellipse(nosePos.x, nosePos.y, orbSize * 1.5, orbSize * 1.5);

    // Bright core
    fill(255, 255, 200, 200 + chargePercent * 55);
    ellipse(nosePos.x, nosePos.y, orbSize, orbSize);

    // White-hot center
    fill(255, 255, 255, 220 + chargePercent * 35);
    ellipse(nosePos.x, nosePos.y, orbSize * 0.5, orbSize * 0.5);
  }

  // renderDeathEffects moved to UIRenderer

  renderPortals() {
    for (let portal of this.portals) {
      let c = color(portal.color);
      let r = red(c), g = green(c), b = blue(c);

      // Fade out as life decreases
      let alpha = map(portal.life, 0, portal.maxLife, 0, 255);

      // Pulsing effect
      let pulse = sin(frameCount * 0.15) * 0.2 + 1;
      let size = portal.radius * pulse;

      noStroke();

      // Outer glow circle (filled)
      fill(r, g, b, alpha * 0.15);
      ellipse(portal.pos.x, portal.pos.y, size * 2.5, size * 2.5);

      // Middle circle (filled)
      fill(r, g, b, alpha * 0.25);
      ellipse(portal.pos.x, portal.pos.y, size * 2, size * 2);

      // Inner circle (filled, brighter)
      fill(r, g, b, alpha * 0.4);
      ellipse(portal.pos.x, portal.pos.y, size * 1.5, size * 1.5);

      // Core circle (white-ish)
      fill(255, 255, 255, alpha * 0.3);
      ellipse(portal.pos.x, portal.pos.y, size, size);

      // Ring outlines for definition
      noFill();
      stroke(r, g, b, alpha * 0.6);
      strokeWeight(2);
      ellipse(portal.pos.x, portal.pos.y, size * 2, size * 2);

      stroke(r, g, b, alpha);
      strokeWeight(1);
      ellipse(portal.pos.x, portal.pos.y, size * 1.5, size * 1.5);

      // "Enter" label
      let labelAlpha = alpha * (0.5 + sin(frameCount * 0.1) * 0.3);  // Ephemeral pulse
      fill(255, 255, 255, labelAlpha);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(12);
      text('Enter', portal.pos.x, portal.pos.y);
    }
  }

  // UI methods (drawScore, drawInstructions, etc.) moved to UIRenderer
}
