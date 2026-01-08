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

    // Explosion delay before transition
    this.pendingSection = null;
    this.transitionDelay = 0;
    this.transitionDelayFrames = 18;  // ~0.30 seconds at 60fps

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
      this.bullets[i].update();
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

    // Check bullet-asteroid collisions
    this.checkCollisions();

    // Check ship-asteroid collisions
    this.checkShipCollisions();

    // Handle transition delay (show explosion before transitioning)
    if (this.pendingSection) {
      this.transitionDelay--;
      if (this.transitionDelay <= 0) {
        this.triggerTransition(this.pendingSection);
        this.pendingSection = null;
      }
      return;  // Don't spawn new asteroids while waiting
    }

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
    // Don't check collisions if we're waiting to transition
    if (this.pendingSection) return;

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        if (this.bullets[i] && this.bullets[i].hits(this.asteroids[j])) {
          // Create explosion particles
          let explosionParticles = this.asteroids[j].explode();
          this.particles.push(...explosionParticles);

          // Get asteroid type before removing
          let asteroidType = this.asteroids[j].type;

          // Award points
          this.score += 10;

          // Remove bullet and asteroid
          this.bullets.splice(i, 1);
          this.asteroids.splice(j, 1);

          // Only trigger transition for section asteroids (not neutral)
          if (asteroidType !== 'neutral') {
            this.pendingSection = asteroidType;
            this.transitionDelay = this.transitionDelayFrames;
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

  fire() {
    if (this.state === GameState.PLAYING) {
      this.bullets.push(this.ship.fire());
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

    // Draw bullets
    for (let bullet of this.bullets) {
      bullet.render();
    }

    // Draw ship
    if (this.ship) {
      this.ship.render();
    }

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

  drawScore() {
    fill(PALETTE.textDim);
    noStroke();
    textAlign(RIGHT, TOP);
    textSize(14);
    text(this.score, width - 20, 20);
  }

  drawInstructions() {
    // Draw legend in bottom left
    let legendX = 20;
    let legendY = height - 60;
    let boxSize = 12;
    let spacing = 80;

    textAlign(LEFT, CENTER);
    textSize(12);

    // Work - Orange
    fill(PALETTE.asteroids.work);
    noStroke();
    rect(legendX, legendY, boxSize, boxSize);
    fill(PALETTE.textDim);
    text('Work', legendX + boxSize + 8, legendY + boxSize / 2);

    // About - Blue
    fill(PALETTE.asteroids.about);
    rect(legendX + spacing, legendY, boxSize, boxSize);
    fill(PALETTE.textDim);
    text('About', legendX + spacing + boxSize + 8, legendY + boxSize / 2);

    // Resume - Yellow
    fill(PALETTE.asteroids.resume);
    rect(legendX + spacing * 2, legendY, boxSize, boxSize);
    fill(PALETTE.textDim);
    text('Resume', legendX + spacing * 2 + boxSize + 8, legendY + boxSize / 2);

    // Controls hint centered at bottom
    fill(PALETTE.textDim);
    textAlign(CENTER, CENTER);
    textSize(14);
    text('Arrow Keys to Move  |  Space to Shoot', width / 2, height - 20);
  }
}
