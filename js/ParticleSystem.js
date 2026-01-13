/**
 * ParticleSystem - Unified particle management
 * Handles all particle types: explosion, charge, beam, death, intro, fire rings
 */
class ParticleSystem {
  constructor() {
    // Particle arrays by type
    this.particles = [];       // General explosion particles
    this.introParticles = [];  // Intro halo effect
    this.chargeParticles = []; // Charging effect around ship
    this.beamParticles = [];   // Beam edge particles
    this.shipDebris = [];      // Death debris
    this.deathRings = [];      // Death expanding rings
    this.fireRings = [];       // Charge shot fire rings
  }

  // === Emit Methods ===

  emitExplosion(x, y, particleColor, count = 15) {
    for (let i = 0; i < count; i++) {
      let angle = random(TWO_PI);
      let speed = random(1, 4);
      this.particles.push({
        pos: createVector(x, y),
        vel: createVector(cos(angle) * speed, sin(angle) * speed),
        life: random(20, 40),
        maxLife: 40,
        size: random(2, 6),
        color: particleColor
      });
    }
  }

  emitIntroHalo(x, y) {
    let angle = random(TWO_PI);
    let distance = random(30, 80);
    this.introParticles.push({
      pos: createVector(x + cos(angle) * distance, y + sin(angle) * distance),
      vel: createVector(random(-0.3, 0.3), random(-0.3, 0.3)),
      life: random(40, 80),
      maxLife: 80,
      size: random(2, 5)
    });
  }

  emitChargeParticle(shipPos, shipRotation, chargeLevel, maxChargeLevel) {
    let chargePercent = chargeLevel / maxChargeLevel;
    let orbitRadius = 25 + chargePercent * 15;
    let angle = random(TWO_PI);
    let startPos = createVector(
      shipPos.x + cos(angle) * orbitRadius * 1.5,
      shipPos.y + sin(angle) * orbitRadius * 1.5
    );

    this.chargeParticles.push({
      pos: startPos,
      targetAngle: angle,
      orbitRadius: orbitRadius,
      life: random(30, 60),
      maxLife: 60,
      size: random(2, 4) * (1 + chargePercent * 0.5),
      shipPos: shipPos,
      speed: random(0.05, 0.1)
    });
  }

  emitBeamParticle(x, y, beamColor, isEdge = false) {
    let perpOffset = isEdge ? random(-15, 15) : random(-5, 5);
    this.beamParticles.push({
      pos: createVector(x + perpOffset, y + perpOffset),
      vel: createVector(random(-1, 1), random(-1, 1)),
      life: random(10, 25),
      maxLife: 25,
      size: random(2, 5),
      color: beamColor
    });
  }

  emitShipDebris(shipPos, count = 12) {
    for (let i = 0; i < count; i++) {
      let angle = random(TWO_PI);
      let speed = random(2, 5);
      this.shipDebris.push({
        pos: shipPos.copy(),
        vel: createVector(cos(angle) * speed, sin(angle) * speed),
        rotation: random(TWO_PI),
        rotationSpeed: random(-0.2, 0.2),
        life: random(60, 120),
        maxLife: 120,
        size: random(4, 10)
      });
    }
  }

  emitDeathRing(pos, delay = 0) {
    this.deathRings.push({
      pos: pos.copy(),
      radius: 10,
      maxRadius: 150,
      alpha: 255,
      speed: 3,
      delay: delay
    });
  }

  emitFireRing(pos, direction, tier = 1) {
    let baseRadius = 20 + tier * 5;
    this.fireRings.push({
      pos: pos.copy(),
      vel: direction.copy().mult(0.5),
      radius: baseRadius,
      maxRadius: baseRadius + 60 + tier * 20,
      alpha: 200,
      tier: tier
    });
  }

  // === Update Methods ===

  update() {
    this.updateParticles();
    this.updateIntroParticles();
    this.updateChargeParticles();
    this.updateBeamParticles();
    this.updateShipDebris();
    this.updateDeathRings();
    this.updateFireRings();
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.pos.add(p.vel);
      p.vel.mult(0.98);
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateIntroParticles() {
    for (let i = this.introParticles.length - 1; i >= 0; i--) {
      let p = this.introParticles[i];
      p.pos.add(p.vel);
      p.vel.mult(0.99);
      p.life--;
      if (p.life <= 0) this.introParticles.splice(i, 1);
    }
  }

  updateChargeParticles() {
    for (let i = this.chargeParticles.length - 1; i >= 0; i--) {
      let p = this.chargeParticles[i];

      // Spiral inward toward ship
      p.targetAngle += p.speed;
      p.orbitRadius *= 0.97;

      let targetX = p.shipPos.x + cos(p.targetAngle) * p.orbitRadius;
      let targetY = p.shipPos.y + sin(p.targetAngle) * p.orbitRadius;

      p.pos.x += (targetX - p.pos.x) * 0.15;
      p.pos.y += (targetY - p.pos.y) * 0.15;

      p.life--;

      // Remove if reached center or expired
      if (p.orbitRadius < 5) {
        this.chargeParticles.splice(i, 1);
      } else if (p.life <= 0) {
        this.chargeParticles.splice(i, 1);
      }
    }
  }

  updateBeamParticles() {
    for (let i = this.beamParticles.length - 1; i >= 0; i--) {
      let p = this.beamParticles[i];
      p.pos.add(p.vel);
      p.vel.mult(0.95);
      p.life--;
      if (p.life <= 0) {
        this.beamParticles.splice(i, 1);
      }
    }
  }

  updateShipDebris() {
    for (let i = this.shipDebris.length - 1; i >= 0; i--) {
      let d = this.shipDebris[i];
      d.pos.add(d.vel);
      d.vel.mult(0.98);
      d.rotation += d.rotationSpeed;
      d.life--;
      if (d.life <= 0) {
        this.shipDebris.splice(i, 1);
      }
    }
  }

  updateDeathRings() {
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
  }

  updateFireRings() {
    for (let i = this.fireRings.length - 1; i >= 0; i--) {
      let ring = this.fireRings[i];
      ring.pos.add(ring.vel);
      ring.radius += 4 + ring.tier;
      ring.alpha -= 5;
      if (ring.alpha <= 0 || ring.radius >= ring.maxRadius) {
        this.fireRings.splice(i, 1);
      }
    }
  }

  // === Render Methods ===

  render() {
    this.renderParticles();
    this.renderBeamParticles();
    this.renderFireRings();
  }

  renderIntro() {
    // Intro particles rendered separately (called from UIRenderer)
    for (let p of this.introParticles) {
      let alpha = map(p.life, 0, p.maxLife, 0, 200);
      noStroke();
      fill(136, 136, 136, alpha * 0.3);
      ellipse(p.pos.x, p.pos.y, p.size * 3, p.size * 3);
      fill(136, 136, 136, alpha);
      ellipse(p.pos.x, p.pos.y, p.size, p.size);
    }
  }

  renderParticles() {
    for (let p of this.particles) {
      let alpha = map(p.life, 0, p.maxLife, 0, 255);
      let c = color(p.color);
      let r = red(c), g = green(c), b = blue(c);
      noStroke();

      // Outer glow
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
  }

  renderChargeParticles(chargePercent) {
    for (let p of this.chargeParticles) {
      let alpha = map(p.life, 0, p.maxLife, 100, 255);
      let size = p.size * (1 + chargePercent * 0.3);

      noStroke();
      // Outer glow
      fill(255, 255, 200, alpha * 0.2);
      ellipse(p.pos.x, p.pos.y, size * 4, size * 4);

      // Core
      fill(255, 255, 200, alpha);
      ellipse(p.pos.x, p.pos.y, size, size);

      // Bright center
      fill(255, 255, 255, alpha);
      ellipse(p.pos.x, p.pos.y, size * 0.5, size * 0.5);
    }
  }

  renderBeamParticles() {
    for (let p of this.beamParticles) {
      let alpha = map(p.life, 0, p.maxLife, 0, 255);
      let c = color(p.color);
      let r = red(c), g = green(c), b = blue(c);

      noStroke();
      fill(r, g, b, alpha * 0.3);
      ellipse(p.pos.x, p.pos.y, p.size * 3, p.size * 3);

      fill(r, g, b, alpha);
      ellipse(p.pos.x, p.pos.y, p.size, p.size);

      fill(255, 255, 255, alpha * 0.5);
      ellipse(p.pos.x, p.pos.y, p.size * 0.4, p.size * 0.4);
    }
  }

  renderFireRings() {
    for (let ring of this.fireRings) {
      noFill();
      let c = color(PALETTE.shipThrust);
      let r = red(c), g = green(c), b = blue(c);

      // Outer glow
      stroke(r, g, b, ring.alpha * 0.3);
      strokeWeight(8);
      ellipse(ring.pos.x, ring.pos.y, ring.radius * 2, ring.radius * 2);

      // Main ring
      stroke(r, g, b, ring.alpha);
      strokeWeight(3);
      ellipse(ring.pos.x, ring.pos.y, ring.radius * 2, ring.radius * 2);

      // Inner bright edge
      stroke(255, 255, 200, ring.alpha * 0.8);
      strokeWeight(1);
      ellipse(ring.pos.x, ring.pos.y, ring.radius * 2 - 4, ring.radius * 2 - 4);
    }
  }

  // === Utility Methods ===

  clear(type = 'all') {
    if (type === 'all') {
      this.particles = [];
      this.introParticles = [];
      this.chargeParticles = [];
      this.beamParticles = [];
      this.shipDebris = [];
      this.deathRings = [];
      this.fireRings = [];
    } else {
      this[type] = [];
    }
  }

  clearCharge() {
    this.chargeParticles = [];
  }

  clearDeath() {
    this.shipDebris = [];
    this.deathRings = [];
  }
}
