class Ship {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.rotation = -PI / 2;  // Point upward initially
    this.rotationSpeed = 0.08;
    this.thrustPower = 0.15;
    this.friction = 0.99;
    this.size = SHAPES.ship.size;
    this.isThrusting = false;
    this.isTurning = false;
    this.turnDirection = 0;  // -1 = left, 1 = right
    this.thrustParticles = [];
    this.muzzleParticles = [];

    // Boost II - Spot boost afterimages
    this.afterimages = [];

    // Boost II - Forcefield
    this.forcefieldActive = false;
    this.forcefieldAlpha = 0;
    this.forcefieldRadius = this.size * 1.5;

    // Boost II - Jolt (temporary speed boost from Spot Boost)
    this.joltMultiplier = 1.0;
    this.joltActive = false;

    // Boost III - Track current boost tier for rendering
    this.boostTier = 0;
  }

  turn(direction, boostTier = 0) {
    let turnMult = boostTier >= 1 ? 1.6 : 1.0;  // 60% sharper turning
    this.rotation += this.rotationSpeed * direction * turnMult;

    // Track turning for swerve effect
    this.isTurning = true;
    this.turnDirection = direction;
  }

  thrust(boostTier = 0) {
    let force = p5.Vector.fromAngle(this.rotation);
    // Jolt (5x decaying), Surge Mode: 3.5x, Boost I: 1.5x, Base: 1x
    let thrustMult = 1.0;
    if (this.joltActive) {
      thrustMult = this.joltMultiplier;  // 5x decaying to 3.5x
    } else if (this.forcefieldActive) {
      thrustMult = 3.5;  // Surge Mode
    } else if (boostTier >= 1) {
      thrustMult = 1.5;  // Boost I
    }
    force.mult(this.thrustPower * thrustMult);
    this.vel.add(force);
    this.isThrusting = true;
    this.emitThrustParticle(boostTier);
  }

  emitThrustParticle(boostTier = 0) {
    // Create thrust particle behind ship
    let offset = p5.Vector.fromAngle(this.rotation + PI);
    offset.mult(this.size);
    let particlePos = p5.Vector.add(this.pos, offset);

    let particleVel = p5.Vector.fromAngle(this.rotation + PI + random(-0.3, 0.3));
    particleVel.mult(random(2, 4));

    this.thrustParticles.push({
      pos: particlePos,
      vel: particleVel,
      life: 20,
      maxLife: 20,
      color: random(PALETTE.particles.thrust)
    });

    // Boost I: Add center plume particle (no spread, faster, curls outward)
    if (boostTier >= 1) {
      let plumeVel = p5.Vector.fromAngle(this.rotation + PI);  // Straight back
      plumeVel.mult(random(2.5, 4));  // Shorter base plume

      this.thrustParticles.push({
        pos: particlePos.copy(),
        vel: plumeVel,
        life: 14,
        maxLife: 14,
        color: random(['#FF6B35', '#FFE66D']),  // Orange/yellow
        isPlume: true,  // Mark for curl behavior
        curlDirection: random() < 0.5 ? 1 : -1  // Curl left or right
      });

      // Swerve effect: emit extra particles opposite to turn direction
      if (this.isTurning) {
        // Emit 2-3 swerve particles for more visible effect
        let numSwerve = floor(random(2, 4));
        for (let i = 0; i < numSwerve; i++) {
          let swerveAngle = this.rotation + PI + (this.turnDirection * -0.5) + random(-0.2, 0.2);
          let swerveVel = p5.Vector.fromAngle(swerveAngle);
          swerveVel.mult(random(5, 8));

          this.thrustParticles.push({
            pos: particlePos.copy(),
            vel: swerveVel,
            life: 28,
            maxLife: 28,
            color: random(['#FF6B35', '#FFE66D']),
            isPlume: true,
            curlDirection: -this.turnDirection
          });
        }
      }

      // Surge Mode: Enhanced thrust trail when forcefield active
      if (this.forcefieldActive) {
        // Emit 2-3 enhanced particles per frame
        let numSurge = floor(random(2, 4));
        for (let i = 0; i < numSurge; i++) {
          let surgeVel = p5.Vector.fromAngle(this.rotation + PI + random(-0.2, 0.2));
          surgeVel.mult(random(6, 10));  // Faster than Boost I

          // 30% white, 70% orange/yellow
          let isWhite = random() < 0.3;
          let surgeColor = isWhite ? '#FFFFFF' : random(['#FF6B35', '#FFE66D']);

          this.thrustParticles.push({
            pos: particlePos.copy(),
            vel: surgeVel,
            life: 35,  // Longer than Boost I
            maxLife: 35,
            color: surgeColor,
            isPlume: true,
            isWhite: isWhite,
            curlDirection: random() < 0.5 ? 1 : -1
          });
        }

        // Boost III: Flame Afterburner - large billowing flame bursts
        if (boostTier >= 3 && frameCount % 3 === 0) {
          // Spawn 1-2 large flame burst particles
          let numBursts = floor(random(1, 3));
          for (let i = 0; i < numBursts; i++) {
            let burstVel = p5.Vector.fromAngle(this.rotation + PI + random(-0.4, 0.4));
            burstVel.mult(random(3, 5));  // Slower than regular particles

            this.thrustParticles.push({
              pos: particlePos.copy(),
              vel: burstVel,
              life: 55,  // Much longer lasting
              maxLife: 55,
              color: random(['#FF6B35', '#FFE66D', '#FFA500']),  // Orange/yellow
              isPlume: true,
              isAfterburner: true,  // Mark for special rendering
              curlDirection: random() < 0.5 ? 1 : -1
            });
          }
        }
      }
    }
  }

  update() {
    // Apply friction
    this.vel.mult(this.friction);

    // Limit max speed
    this.vel.limit(8);

    // Update position
    this.pos.add(this.vel);

    // Wrap around screen edges
    this.wrapEdges();

    // Update thrust particles
    this.updateParticles();

    this.isThrusting = false;
    this.isTurning = false;
    this.turnDirection = 0;
  }

  updateParticles() {
    for (let i = this.thrustParticles.length - 1; i >= 0; i--) {
      let p = this.thrustParticles[i];
      p.pos.add(p.vel);
      p.life--;

      // Plume particles curl outward as they age (mushroom effect)
      if (p.isPlume) {
        let age = 1 - (p.life / p.maxLife);  // 0 at start, 1 at end
        let curlStrength = age * 0.15;  // Increases over time
        let perpAngle = atan2(p.vel.y, p.vel.x) + HALF_PI * p.curlDirection;
        p.vel.x += cos(perpAngle) * curlStrength;
        p.vel.y += sin(perpAngle) * curlStrength;
      }

      if (p.life <= 0) {
        this.thrustParticles.splice(i, 1);
      }
    }

    for (let i = this.muzzleParticles.length - 1; i >= 0; i--) {
      let p = this.muzzleParticles[i];
      p.pos.add(p.vel);
      p.vel.mult(0.9);  // Slow down quickly
      p.life--;
      if (p.life <= 0) {
        this.muzzleParticles.splice(i, 1);
      }
    }

    // Update afterimages (fade out quickly)
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].alpha -= 20;  // Quick fade (~0.2s)
      if (this.afterimages[i].alpha <= 0) {
        this.afterimages.splice(i, 1);
      }
    }

    // Update forcefield alpha
    if (this.forcefieldActive) {
      this.forcefieldAlpha = min(this.forcefieldAlpha + 25, 255);
    } else {
      this.forcefieldAlpha = max(this.forcefieldAlpha - 15, 0);  // Graceful fade
    }

    // Update jolt decay (5x → 3.5x over 30 frames)
    if (this.joltActive) {
      this.joltMultiplier = max(3.5, this.joltMultiplier - (1.5 / 30));
      if (this.joltMultiplier <= 3.5) {
        this.joltActive = false;
      }
    }
  }

  wrapEdges() {
    if (this.pos.x > width + this.size) this.pos.x = -this.size;
    if (this.pos.x < -this.size) this.pos.x = width + this.size;
    if (this.pos.y > height + this.size) this.pos.y = -this.size;
    if (this.pos.y < -this.size) this.pos.y = height + this.size;
  }

  // === Boost II Methods ===

  spotBoost(boostTier = 2) {
    // One-time velocity impulse in facing direction
    let impulse = p5.Vector.fromAngle(this.rotation);
    impulse.mult(5);  // Burst strength
    this.vel.add(impulse);

    // Activate jolt - 5x multiplier that decays to 3.5x over ~0.5s
    this.joltMultiplier = 5.0;
    this.joltActive = true;

    // Store current position for afterimage
    this.afterimages.push({
      pos: this.pos.copy(),
      rotation: this.rotation,
      alpha: 255
    });

    // Emit particle burst
    this.emitSpotBoostParticles();

    // Boost III: Return Echo data for game to spawn
    if (boostTier >= 3) {
      return {
        pos: this.getNosePosition(),
        rotation: this.rotation,
        vel: p5.Vector.fromAngle(this.rotation).mult(12),  // Faster Echo speed
        shipSize: this.size
      };
    }
    return null;
  }

  emitSpotBoostParticles() {
    // Dramatic burst of particles behind ship
    let offset = p5.Vector.fromAngle(this.rotation + PI);
    offset.mult(this.size);
    let burstPos = p5.Vector.add(this.pos, offset);

    for (let i = 0; i < 25; i++) {
      let angle = this.rotation + PI + random(-1.0, 1.0);
      let speed = random(6, 14);
      let vel = p5.Vector.fromAngle(angle).mult(speed);

      // 30% white dazzling particles, 70% orange/yellow
      let isWhite = random() < 0.3;
      let particleColor = isWhite ? '#FFFFFF' : random(['#FF6B35', '#FFE66D', '#FFA500']);

      this.thrustParticles.push({
        pos: burstPos.copy(),
        vel: vel,
        life: 25,
        maxLife: 25,
        color: particleColor,
        isPlume: true,
        isWhite: isWhite,
        curlDirection: random() < 0.5 ? 1 : -1
      });
    }
  }

  activateForcefield() {
    this.forcefieldActive = true;
  }

  deactivateForcefield() {
    this.forcefieldActive = false;
  }

  getNosePosition() {
    let nose = p5.Vector.fromAngle(this.rotation);
    nose.mult(this.size);
    nose.add(this.pos);
    return nose;
  }

  fire() {
    // Create bullet at ship's nose
    let bulletPos = this.getNosePosition();

    let bulletVel = p5.Vector.fromAngle(this.rotation);
    bulletVel.mult(SHAPES.bullet.speed);
    bulletVel.add(this.vel);  // Add ship's velocity

    // Emit muzzle flash particles
    this.emitMuzzleFlash(bulletPos);

    return new Bullet(bulletPos.x, bulletPos.y, bulletVel.x, bulletVel.y);
  }

  fireCharged(chargeLevel, maxCharge, tier = 1) {
    let nosePos = this.getNosePosition();

    // Scale bullet size based on charge (1x to 4x)
    let chargePercent = chargeLevel / maxCharge;
    let bulletScale = 1 + chargePercent * 3;

    let bulletVel = p5.Vector.fromAngle(this.rotation);
    // Speed multiplier: tier 2 is faster (+30%)
    let speedMult = 0.8 + chargePercent * 0.4;
    if (tier >= 2) speedMult += 0.3;
    bulletVel.mult(SHAPES.bullet.speed * speedMult);
    bulletVel.add(this.vel);

    // Bigger muzzle flash for charged shot
    this.emitChargedMuzzleFlash(nosePos, chargePercent);

    return new Bullet(nosePos.x, nosePos.y, bulletVel.x, bulletVel.y, bulletScale, tier);
  }

  emitMuzzleFlash(nosePos) {
    // Create a small burst of particles at the nose
    for (let i = 0; i < 6; i++) {
      let angle = this.rotation + random(-0.4, 0.4);
      let speed = random(2, 5);
      this.muzzleParticles.push({
        pos: nosePos.copy(),
        vel: p5.Vector.fromAngle(angle).mult(speed),
        life: random(8, 15),
        maxLife: 15,
        size: random(2, 5)
      });
    }
  }

  emitChargedMuzzleFlash(nosePos, chargePercent) {
    // Create a bigger burst of particles based on charge level
    let numParticles = 10 + floor(chargePercent * 20);  // 10-30 particles
    for (let i = 0; i < numParticles; i++) {
      let angle = this.rotation + random(-0.6, 0.6);
      let speed = random(3, 8) * (0.8 + chargePercent * 0.5);
      let size = random(3, 8) * (1 + chargePercent);
      this.muzzleParticles.push({
        pos: nosePos.copy(),
        vel: p5.Vector.fromAngle(angle).mult(speed),
        life: random(12, 25),
        maxLife: 25,
        size: size
      });
    }
  }

  emitTier2MuzzleFlash(nosePos, chargePercent) {
    // More particles than tier 1 (1.5x), some cyan
    let numParticles = floor((10 + floor(chargePercent * 20)) * 1.5);
    for (let i = 0; i < numParticles; i++) {
      let angle = this.rotation + random(-0.6, 0.6);
      let speed = random(3, 8) * (0.8 + chargePercent * 0.5);
      let size = random(3, 8) * (1 + chargePercent);
      // 40% chance of cyan particle
      let isCyan = random() < 0.4;
      this.muzzleParticles.push({
        pos: nosePos.copy(),
        vel: p5.Vector.fromAngle(angle).mult(speed),
        life: random(12, 25),
        maxLife: 25,
        size: size,
        isCyan: isCyan
      });
    }
  }

  emitTier3MuzzleFlash(nosePos, chargePercent) {
    // More particles than tier 2 (2x), with magenta and cyan
    let numParticles = floor((10 + floor(chargePercent * 20)) * 2);
    for (let i = 0; i < numParticles; i++) {
      let angle = this.rotation + random(-0.7, 0.7);
      let speed = random(4, 10) * (0.8 + chargePercent * 0.5);
      let size = random(4, 10) * (1 + chargePercent);
      // ~30% magenta, ~30% cyan, ~40% white
      let colorRoll = random();
      let isCyan = false;
      let isMagenta = false;
      if (colorRoll < 0.3) {
        isMagenta = true;
      } else if (colorRoll < 0.6) {
        isCyan = true;
      }
      this.muzzleParticles.push({
        pos: nosePos.copy(),
        vel: p5.Vector.fromAngle(angle).mult(speed),
        life: random(15, 30),
        maxLife: 30,
        size: size,
        isCyan: isCyan,
        isMagenta: isMagenta
      });
    }
  }

  render() {
    // Draw thrust particles first (behind ship)
    for (let p of this.thrustParticles) {
      let alpha = map(p.life, 0, p.maxLife, 0, 255);
      let c = color(p.color);
      let r = red(c), g = green(c), b = blue(c);
      noStroke();

      if (p.isPlume) {
        // Plume particles: larger with glow effect
        // Afterburner particles are 2.5x larger
        let baseSize = p.isAfterburner ? map(p.life, 0, p.maxLife, 5, 20) : map(p.life, 0, p.maxLife, 2, 8);
        let size = baseSize;

        // Outer glow
        fill(r, g, b, alpha * 0.15);
        ellipse(p.pos.x, p.pos.y, size * 4, size * 4);

        // Middle glow
        fill(r, g, b, alpha * 0.3);
        ellipse(p.pos.x, p.pos.y, size * 2.5, size * 2.5);

        // Core
        fill(r, g, b, alpha);
        ellipse(p.pos.x, p.pos.y, size, size);

        // White hot center
        fill(255, 255, 255, alpha * 0.6);
        ellipse(p.pos.x, p.pos.y, size * 0.4, size * 0.4);
      } else {
        // Regular spray particles
        let size = map(p.life, 0, p.maxLife, 1, 4);
        fill(r, g, b, alpha);
        ellipse(p.pos.x, p.pos.y, size, size);
      }
    }

    // Draw muzzle flash particles
    for (let p of this.muzzleParticles) {
      let alpha = map(p.life, 0, p.maxLife, 0, 255);
      noStroke();

      if (p.isMagenta) {
        // Magenta particle (for tier 3)
        fill(255, 0, 255, alpha * 0.3);
        ellipse(p.pos.x, p.pos.y, p.size * 3, p.size * 3);
        fill(255, 0, 255, alpha);
      } else if (p.isCyan) {
        // Cyan particle (for tier 2+)
        fill(0, 255, 255, alpha * 0.3);
        ellipse(p.pos.x, p.pos.y, p.size * 3, p.size * 3);
        fill(0, 255, 255, alpha);
      } else {
        // Normal white/yellow particle
        fill(255, 255, 200, alpha * 0.3);
        ellipse(p.pos.x, p.pos.y, p.size * 3, p.size * 3);
        fill(255, 255, 255, alpha);
      }
      ellipse(p.pos.x, p.pos.y, p.size, p.size);
    }

    // Draw afterimages (Boost II spot boost)
    for (let img of this.afterimages) {
      push();
      translate(img.pos.x, img.pos.y);
      rotate(img.rotation);

      // Ghost ship outline
      noFill();
      stroke(255, 165, 0, img.alpha * 0.6);  // Orange ghost
      strokeWeight(1);
      triangle(
        this.size, 0,
        -this.size * 0.5, -this.size * 0.65,
        -this.size * 0.5, this.size * 0.65
      );

      pop();
    }

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);

    // Boost III: Neon green ship glow during Surge Mode
    if (this.boostTier >= 3 && this.forcefieldAlpha > 0) {
      let glowAlpha = this.forcefieldAlpha;
      noFill();

      // Outer glow (neon green - same as ship color)
      stroke(0, 255, 65, glowAlpha * 0.15);
      strokeWeight(14);
      triangle(
        this.size, 0,
        -this.size * 0.5, -this.size * 0.65,
        -this.size * 0.5, this.size * 0.65
      );

      // Middle glow
      stroke(0, 255, 65, glowAlpha * 0.3);
      strokeWeight(8);
      triangle(
        this.size, 0,
        -this.size * 0.5, -this.size * 0.65,
        -this.size * 0.5, this.size * 0.65
      );

      // Inner glow
      stroke(0, 255, 65, glowAlpha * 0.5);
      strokeWeight(4);
      triangle(
        this.size, 0,
        -this.size * 0.5, -this.size * 0.65,
        -this.size * 0.5, this.size * 0.65
      );
    }

    // Draw ship body
    fill(PALETTE.background);
    stroke(PALETTE.ship);
    strokeWeight(1);

    // Slightly isoceles triangle ship pointing right (rotation 0 = right)
    triangle(
      this.size, 0,
      -this.size * 0.5, -this.size * 0.65,
      -this.size * 0.5, this.size * 0.65
    );

    // Draw thrust flame when thrusting
    if (this.isThrusting) {
      fill(PALETTE.shipThrust);
      noStroke();
      beginShape();
      vertex(-this.size * 0.5, -this.size * 0.2);
      vertex(-this.size * 1.2 - random(5), 0);
      vertex(-this.size * 0.5, this.size * 0.2);
      endShape(CLOSE);
    }

    pop();

    // Draw forcefield (Boost II)
    if (this.forcefieldAlpha > 0) {
      this.renderForcefield();
    }
  }

  renderForcefield() {
    let alpha = this.forcefieldAlpha;
    let nosePos = this.getNosePosition();

    // Boost III: Wider (180°) and much flatter (larger radius)
    // Boost II: 150° arc
    let arcAngle, arcRadius;
    if (this.boostTier >= 3) {
      arcAngle = PI * 90 / 180;  // 90 degrees each side = 180° total
      arcRadius = this.forcefieldRadius * 2.5;  // Much flatter = larger radius
    } else {
      arcAngle = PI * 75 / 180;  // 75 degrees each side = 150° total
      arcRadius = this.forcefieldRadius * 1.2;
    }

    let arcStart = this.rotation - arcAngle;
    let arcEnd = this.rotation + arcAngle;

    push();
    translate(nosePos.x, nosePos.y);
    noFill();

    // Boost III: Extra outer glow
    if (this.boostTier >= 3) {
      stroke(0, 255, 255, alpha * 0.1);
      strokeWeight(20);
      arc(0, 0, arcRadius * 2, arcRadius * 2, arcStart, arcEnd);
    }

    // Outer glow
    stroke(0, 255, 255, alpha * 0.2);
    strokeWeight(12);
    arc(0, 0, arcRadius * 2, arcRadius * 2, arcStart, arcEnd);

    // Middle glow
    stroke(0, 255, 255, alpha * 0.4);
    strokeWeight(6);
    arc(0, 0, arcRadius * 2, arcRadius * 2, arcStart, arcEnd);

    // Core arc
    stroke(0, 255, 255, alpha * 0.8);
    strokeWeight(2);
    arc(0, 0, arcRadius * 2, arcRadius * 2, arcStart, arcEnd);

    // Bright inner edge
    stroke(255, 255, 255, alpha * 0.5);
    strokeWeight(1);
    arc(0, 0, arcRadius * 1.8, arcRadius * 1.8, arcStart, arcEnd);

    pop();
  }
}
