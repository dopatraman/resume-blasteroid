const GameState = {
  PLAYING: 'playing',
  TRANSITIONING: 'transitioning',
  SECTION: 'section'
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
    this.asteroidTypes = ['work', 'about', 'resume'];
    this.maxAsteroids = 5;
    this.spawnTimer = 0;
    this.spawnInterval = 180;  // frames between spawns
  }

  init() {
    this.ship = new Ship(width / 2, height / 2);
    this.spawnInitialAsteroids();
  }

  spawnInitialAsteroids() {
    // Spawn one of each type initially
    for (let type of this.asteroidTypes) {
      this.asteroids.push(Asteroid.spawnFromEdge(type));
    }
  }

  update() {
    if (this.state === GameState.PLAYING) {
      this.updatePlaying();
    } else if (this.state === GameState.TRANSITIONING) {
      this.updateTransition();
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

    // Check collisions
    this.checkCollisions();

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

          // Get section type before removing
          let sectionType = this.asteroids[j].type;

          // Remove bullet and asteroid
          this.bullets.splice(i, 1);
          this.asteroids.splice(j, 1);

          // Trigger transition to section
          this.triggerTransition(sectionType);
          return;  // Exit after hit
        }
      }
    }
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

    // Keep spawning asteroids to maintain variety
    if (this.spawnTimer >= this.spawnInterval && this.asteroids.length < this.maxAsteroids) {
      // Find which types are missing or underrepresented
      let typeCounts = { work: 0, about: 0, resume: 0 };
      for (let a of this.asteroids) {
        typeCounts[a.type]++;
      }

      // Spawn the type with lowest count
      let minType = 'work';
      let minCount = typeCounts.work;
      for (let type of this.asteroidTypes) {
        if (typeCounts[type] < minCount) {
          minCount = typeCounts[type];
          minType = type;
        }
      }

      this.asteroids.push(Asteroid.spawnFromEdge(minType));
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
      this.fadeAlpha += 10;
      if (this.fadeAlpha >= 255) {
        this.fadeAlpha = 255;
        this.showSection();
      }
    } else if (this.fadeDirection === -1) {
      // Fading in (returning to game)
      this.fadeAlpha -= 10;
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

    // Draw particles
    for (let p of this.particles) {
      let alpha = map(p.life, 0, p.maxLife, 0, 255);
      fill(red(color(p.color)), green(color(p.color)), blue(color(p.color)), alpha);
      noStroke();
      ellipse(p.pos.x, p.pos.y, p.size, p.size);
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

    // Draw fade overlay during transitions
    if (this.state === GameState.TRANSITIONING || this.fadeAlpha > 0) {
      fill(10, 10, 10, this.fadeAlpha);
      noStroke();
      rect(0, 0, width, height);
    }

    // Draw instructions when playing
    if (this.state === GameState.PLAYING) {
      this.drawInstructions();
    }
  }

  drawInstructions() {
    fill(PALETTE.textDim);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(14);
    text('Arrow Keys to Move  |  Space to Shoot  |  Hit an asteroid to explore', width / 2, height - 30);
  }
}
