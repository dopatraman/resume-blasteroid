const GameState = {
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
    this.particles = [];
    this.currentSection = null;

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
    this.deathRings = [];          // Pulsing rings effect
    this.shipDebris = [];          // Ship debris particles

    // Portals
    this.portals = [];

    // Charged shot
    this.isCharging = false;
    this.chargeLevel = 0;
    this.maxChargeLevel = 90;      // 1.5 seconds at 60fps
    this.chargeParticles = [];
    this.spaceHeld = false;
    this.spaceHoldTime = 0;
    this.chargeThreshold = 12;     // ~200ms before charging starts

    // Powerups
    this.powerups = [];           // Floating powerup entities
    this.powerupDrops = [];       // Collectibles after shooting
    this.activePowerups = {       // Currently held powerups
      homing: false,
      chargeshot: false
    };
    this.powerupSpawnTimer = 0;
    this.powerupSpawnInterval = 600;  // 10 seconds at 60fps
  }

  init() {
    this.ship = new Ship(width / 2, height / 2);
    this.spawnInitialAsteroids();
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
    if (this.state === GameState.PLAYING) {
      this.updatePlaying();
    } else if (this.state === GameState.TRANSITIONING) {
      this.updateTransition();
    } else if (this.state === GameState.DEAD) {
      this.updateDeath();
    }
    // SECTION state - game paused, handled by DOM
  }

  updatePlaying() {
    // Update ship
    this.handleInput();
    this.ship.update();

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].update(this.activePowerups.homing ? this.asteroids : []);
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

    // Check bullet-asteroid collisions
    this.checkCollisions();

    // Check ship-asteroid collisions
    this.checkShipCollisions();

    // Update portals and check if ship enters one
    this.updatePortals();
    this.checkPortalCollisions();

    // Update powerups
    this.updatePowerups();
    this.updatePowerupDrops();
    this.checkPowerupCollisions();
    this.checkPowerupDropCollisions();
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

  checkCollisions() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        if (this.bullets[i] && this.bullets[i].hits(this.asteroids[j])) {
          // Create explosion particles
          let explosionParticles = this.asteroids[j].explode();
          this.particles.push(...explosionParticles);

          // Get asteroid type and position before removing
          let asteroidType = this.asteroids[j].type;
          let asteroidPos = this.asteroids[j].pos;

          // Award points
          this.score += 10;

          // Remove bullet and asteroid
          this.bullets.splice(i, 1);
          this.asteroids.splice(j, 1);

          // Spawn portal for section asteroids (not neutral)
          if (asteroidType !== 'neutral') {
            this.spawnPortal(asteroidPos, asteroidType);
          }
          return;  // Exit after hit
        }
      }
    }
  }

  checkShipCollisions() {
    if (!this.ship) return;

    for (let asteroid of this.asteroids) {
      let d = dist(this.ship.pos.x, this.ship.pos.y, asteroid.pos.x, asteroid.pos.y);
      if (d < asteroid.radius + this.ship.size * 0.5) {
        this.shipDeath();
        return;
      }
    }
  }

  shipDeath() {
    let shipPos = this.ship.pos.copy();
    let shipColor = PALETTE.ship;

    // Create debris particles (ship fragments)
    for (let i = 0; i < 40; i++) {
      let angle = random(TWO_PI);
      let speed = random(1, 4);
      this.shipDebris.push({
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
      this.deathRings.push({
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
    this.activePowerups.homing = false;
    this.activePowerups.chargeshot = false;
  }

  updateDeath() {
    this.shipDeathTimer++;

    // Update debris particles
    for (let i = this.shipDebris.length - 1; i >= 0; i--) {
      let d = this.shipDebris[i];
      d.pos.add(d.vel);
      d.vel.mult(0.98);
      d.rotation += d.rotSpeed;
      d.life--;
      if (d.life <= 0) {
        this.shipDebris.splice(i, 1);
      }
    }

    // Update pulsing rings
    for (let i = this.deathRings.length - 1; i >= 0; i--) {
      let ring = this.deathRings[i];
      if (ring.delay > 0) {
        ring.delay--;
        continue;
      }
      ring.radius += ring.speed;
      ring.alpha = map(ring.radius, 10, ring.maxRadius, 255, 0);
      if (ring.radius >= ring.maxRadius) {
        this.deathRings.splice(i, 1);
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
    this.shipDebris = [];
    this.deathRings = [];

    // Clear nearby asteroids to give player breathing room
    this.asteroids = this.asteroids.filter(a => {
      let d = dist(a.pos.x, a.pos.y, width / 2, height / 2);
      return d > 200;
    });
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.pos.add(p.vel);
      p.vel.mult(0.98);  // Slow down
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
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

  checkPortalCollisions() {
    if (!this.ship) return;

    for (let i = this.portals.length - 1; i >= 0; i--) {
      let portal = this.portals[i];
      let d = dist(this.ship.pos.x, this.ship.pos.y, portal.pos.x, portal.pos.y);
      if (d < portal.radius + this.ship.size * 0.3) {
        this.triggerTransition(portal.type);
        this.portals = [];  // Clear all portals on transition
        return;
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

  checkPowerupCollisions() {
    // Check if bullets hit powerups
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      for (let j = this.powerups.length - 1; j >= 0; j--) {
        if (this.powerups[j].hits(this.bullets[i])) {
          // Create powerup drop at powerup position
          let powerup = this.powerups[j];
          this.powerupDrops.push(new PowerupDrop(powerup.pos.x, powerup.pos.y, powerup.type));

          // Remove bullet and powerup
          this.bullets.splice(i, 1);
          this.powerups.splice(j, 1);
          return;
        }
      }
    }
  }

  checkPowerupDropCollisions() {
    if (!this.ship) return;

    for (let i = this.powerupDrops.length - 1; i >= 0; i--) {
      let drop = this.powerupDrops[i];
      let d = dist(this.ship.pos.x, this.ship.pos.y, drop.pos.x, drop.pos.y);
      if (d < drop.radius + this.ship.size * 0.5) {
        // Activate powerup
        this.activatePowerup(drop.type);
        this.powerupDrops.splice(i, 1);
        return;
      }
    }
  }

  activatePowerup(type) {
    switch (type) {
      case 'homing':
        this.activePowerups.homing = true;
        break;
      case 'chargeshot':
        this.activePowerups.chargeshot = true;
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
      // If no chargeshot powerup, fire normal bullet immediately
      if (!this.activePowerups.chargeshot) {
        this.bullets.push(this.ship.fire());
        return;
      }
      // Otherwise, start charging
      this.spaceHeld = true;
      this.spaceHoldTime = 0;
    }
  }

  releaseCharge() {
    if (this.state !== GameState.PLAYING || !this.ship) {
      this.spaceHeld = false;
      this.isCharging = false;
      return;
    }

    // If no chargeshot powerup, do nothing (already fired on press)
    if (!this.activePowerups.chargeshot) {
      return;
    }

    if (this.isCharging) {
      // Fire charged shot
      let bullet = this.ship.fireCharged(this.chargeLevel, this.maxChargeLevel);
      this.bullets.push(bullet);
    } else if (this.spaceHeld) {
      // Quick tap - fire normal bullet
      this.bullets.push(this.ship.fire());
    }

    // Reset all charging state
    this.spaceHeld = false;
    this.spaceHoldTime = 0;
    this.isCharging = false;
    this.chargeLevel = 0;
    this.chargeParticles = [];
  }

  updateCharging() {
    if (!this.ship) return;

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

    // Spawn energy particles flowing inward (more as charge increases)
    let spawnRate = 1 + floor(chargePercent * 3);  // 1-4 particles per frame
    for (let i = 0; i < spawnRate; i++) {
      // Spawn in a ring around the ship
      let angle = random(TWO_PI);
      let distance = random(80, 120);
      let spawnPos = createVector(
        nosePos.x + cos(angle) * distance,
        nosePos.y + sin(angle) * distance
      );

      // Calculate velocity toward nose
      let toNose = p5.Vector.sub(nosePos, spawnPos);
      let speed = 3 + chargePercent * 4;  // Faster as charge increases
      toNose.setMag(speed);

      this.chargeParticles.push({
        pos: spawnPos,
        vel: toNose,
        target: nosePos.copy(),
        life: 30,
        maxLife: 30,
        size: random(2, 4)
      });
    }

    // Update charge particles
    for (let i = this.chargeParticles.length - 1; i >= 0; i--) {
      let p = this.chargeParticles[i];

      // Update target to current nose position (ship might move)
      p.target = this.ship.getNosePosition();

      // Steer toward target
      let toTarget = p5.Vector.sub(p.target, p.pos);
      if (toTarget.mag() < 10) {
        // Close enough, remove particle
        this.chargeParticles.splice(i, 1);
        continue;
      }
      toTarget.setMag(p.vel.mag() * 1.05);  // Accelerate slightly
      p.vel = toTarget;

      p.pos.add(p.vel);
      p.life--;

      if (p.life <= 0) {
        this.chargeParticles.splice(i, 1);
      }
    }
  }

  render() {
    // Always draw game elements
    background(PALETTE.background);

    // Draw particles with glowing ember effect
    for (let p of this.particles) {
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

    // Draw asteroids
    for (let asteroid of this.asteroids) {
      asteroid.render();
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

    // Draw ship
    if (this.ship) {
      this.ship.render();
    }

    // Draw charging effect
    this.renderCharging();

    // Draw death effects
    this.renderDeathEffects();

    // Draw fade overlay during transitions
    if (this.state === GameState.TRANSITIONING || this.fadeAlpha > 0) {
      fill(10, 10, 10, this.fadeAlpha);
      noStroke();
      rect(0, 0, width, height);
    }

    // Draw UI when playing or dead
    if (this.state === GameState.PLAYING || this.state === GameState.DEAD) {
      this.drawScore();
      if (this.state === GameState.PLAYING) {
        this.drawInstructions();
      }
    }
  }

  renderCharging() {
    if (!this.isCharging || !this.ship) return;

    let c = color(PALETTE.ship);
    let r = red(c), g = green(c), b = blue(c);
    let chargePercent = this.chargeLevel / this.maxChargeLevel;
    let nosePos = this.ship.getNosePosition();

    // Draw energy particles flowing inward
    for (let p of this.chargeParticles) {
      let alpha = map(p.life, 0, p.maxLife, 50, 255);
      noStroke();

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

    // Draw growing orb at ship nose
    let baseSize = 5;
    let maxGrowth = 20;
    let orbSize = baseSize + chargePercent * maxGrowth;
    let pulse = sin(frameCount * 0.2) * 0.2 + 1;  // Pulsing effect

    // Outer glow
    fill(r, g, b, 50 + chargePercent * 50);
    noStroke();
    ellipse(nosePos.x, nosePos.y, orbSize * 4 * pulse, orbSize * 4 * pulse);

    // Middle glow
    fill(r, g, b, 100 + chargePercent * 100);
    ellipse(nosePos.x, nosePos.y, orbSize * 2.5 * pulse, orbSize * 2.5 * pulse);

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

  renderDeathEffects() {
    let c = color(PALETTE.ship);
    let r = red(c), g = green(c), b = blue(c);

    // Draw pulsing rings
    for (let ring of this.deathRings) {
      if (ring.delay > 0) continue;

      noFill();

      // Outer glow
      stroke(r, g, b, ring.alpha * 0.2);
      strokeWeight(8);
      ellipse(ring.pos.x, ring.pos.y, ring.radius * 2, ring.radius * 2);

      // Middle ring
      stroke(r, g, b, ring.alpha * 0.5);
      strokeWeight(4);
      ellipse(ring.pos.x, ring.pos.y, ring.radius * 2, ring.radius * 2);

      // Bright core ring
      stroke(r, g, b, ring.alpha);
      strokeWeight(2);
      ellipse(ring.pos.x, ring.pos.y, ring.radius * 2, ring.radius * 2);

      // White inner edge
      stroke(255, 255, 255, ring.alpha * 0.7);
      strokeWeight(1);
      ellipse(ring.pos.x, ring.pos.y, ring.radius * 2 - 4, ring.radius * 2 - 4);
    }

    // Draw ship debris with glow
    for (let d of this.shipDebris) {
      let alpha = map(d.life, 0, d.maxLife, 0, 255);
      noStroke();

      // Outer glow
      fill(r, g, b, alpha * 0.15);
      ellipse(d.pos.x, d.pos.y, d.size * 4, d.size * 4);

      // Middle glow
      fill(r, g, b, alpha * 0.3);
      ellipse(d.pos.x, d.pos.y, d.size * 2.5, d.size * 2.5);

      // Core
      fill(r, g, b, alpha);
      push();
      translate(d.pos.x, d.pos.y);
      rotate(d.rotation);
      // Draw as small triangle fragment
      triangle(0, -d.size/2, -d.size/2, d.size/2, d.size/2, d.size/2);
      pop();

      // White hot center
      fill(255, 255, 255, alpha * 0.6);
      ellipse(d.pos.x, d.pos.y, d.size * 0.3, d.size * 0.3);
    }
  }

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

  drawScore() {
    fill(PALETTE.textDim);
    noStroke();
    textAlign(RIGHT, TOP);
    textSize(14);
    text(this.score, width - 20, 20);

    // Active powerups display
    this.drawActivePowerups();
  }

  drawActivePowerups() {
    let yOffset = 45;
    textAlign(RIGHT, TOP);
    textSize(11);

    if (this.activePowerups.chargeshot) {
      let c = color('#00FFFF');
      fill(red(c), green(c), blue(c), 200);
      text('Charge', width - 20, yOffset);
      yOffset += 18;
    }

    if (this.activePowerups.homing) {
      let c = color('#FF00FF');
      fill(red(c), green(c), blue(c), 200);
      text('Homing', width - 20, yOffset);
      yOffset += 18;
    }
  }

  drawInstructions() {
    let bottomMargin = 40;
    let rowY = height - bottomMargin;
    let boxSize = 12;
    let legendSpacing = 70;

    // --- Legend (left side) ---
    let legendX = 30;

    textAlign(LEFT, CENTER);
    textSize(11);

    // Work - Orange
    fill(PALETTE.asteroids.work);
    noStroke();
    rect(legendX, rowY - boxSize / 2, boxSize, boxSize);
    fill(PALETTE.textDim);
    text('Work', legendX + boxSize + 6, rowY);

    // About - Blue
    fill(PALETTE.asteroids.about);
    rect(legendX + legendSpacing, rowY - boxSize / 2, boxSize, boxSize);
    fill(PALETTE.textDim);
    text('About', legendX + legendSpacing + boxSize + 6, rowY);

    // Resume - Yellow
    fill(PALETTE.asteroids.resume);
    rect(legendX + legendSpacing * 2, rowY - boxSize / 2, boxSize, boxSize);
    fill(PALETTE.textDim);
    text('Resume', legendX + legendSpacing * 2 + boxSize + 6, rowY);

    // --- Controls (right side) ---
    this.drawControlsHint(rowY);
  }

  drawControlsHint(rowY) {
    let keySize = 18;
    let keyGap = 2;
    let rightMargin = 30;

    // Position from right edge
    let controlsEndX = width - rightMargin;

    // "shoot" text and spacebar
    let spaceWidth = 45;
    textAlign(LEFT, CENTER);
    textSize(11);
    fill(PALETTE.textDim);
    noStroke();

    let shootTextX = controlsEndX - 30;
    text('shoot', shootTextX, rowY);

    let spaceX = shootTextX - spaceWidth - 10;
    this.drawKey(spaceX, rowY - keySize / 2, keySize, '', spaceWidth);

    // "move" text
    let moveTextX = spaceX - 45;
    text('move', moveTextX, rowY);

    // Arrow keys layout (keyboard style)
    //     [↑]
    // [←][↓][→]
    let arrowsRightEdge = moveTextX - 15;
    let arrowsCenterX = arrowsRightEdge - keySize - keyGap - keySize / 2;

    // Up arrow (centered above down)
    this.drawKey(arrowsCenterX - keySize / 2, rowY - keySize - keyGap / 2 - keySize / 2, keySize, '↑');

    // Left, Down, Right arrows
    this.drawKey(arrowsCenterX - keySize / 2 - keyGap - keySize, rowY - keySize / 2, keySize, '←');
    this.drawKey(arrowsCenterX - keySize / 2, rowY - keySize / 2, keySize, '↓');
    this.drawKey(arrowsCenterX + keySize / 2 + keyGap, rowY - keySize / 2, keySize, '→');
  }

  drawKey(x, y, size, label, width = null) {
    let w = width || size;
    let r = 4;  // Corner radius

    // Key background
    stroke(PALETTE.textDim);
    strokeWeight(1);
    fill(PALETTE.background);
    rect(x, y, w, size, r);

    // Key label
    if (label) {
      fill(PALETTE.textDim);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(11);
      text(label, x + w / 2, y + size / 2);
    }
  }
}
