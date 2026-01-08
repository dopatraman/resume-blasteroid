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
    this.thrustParticles = [];
    this.muzzleParticles = [];
  }

  turn(direction) {
    this.rotation += this.rotationSpeed * direction;
  }

  thrust() {
    let force = p5.Vector.fromAngle(this.rotation);
    force.mult(this.thrustPower);
    this.vel.add(force);
    this.isThrusting = true;
    this.emitThrustParticle();
  }

  emitThrustParticle() {
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
  }

  updateParticles() {
    for (let i = this.thrustParticles.length - 1; i >= 0; i--) {
      let p = this.thrustParticles[i];
      p.pos.add(p.vel);
      p.life--;
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
  }

  wrapEdges() {
    if (this.pos.x > width + this.size) this.pos.x = -this.size;
    if (this.pos.x < -this.size) this.pos.x = width + this.size;
    if (this.pos.y > height + this.size) this.pos.y = -this.size;
    if (this.pos.y < -this.size) this.pos.y = height + this.size;
  }

  fire() {
    // Create bullet at ship's nose
    let bulletPos = p5.Vector.fromAngle(this.rotation);
    bulletPos.mult(this.size);
    bulletPos.add(this.pos);

    let bulletVel = p5.Vector.fromAngle(this.rotation);
    bulletVel.mult(SHAPES.bullet.speed);
    bulletVel.add(this.vel);  // Add ship's velocity

    // Emit muzzle flash particles
    this.emitMuzzleFlash(bulletPos);

    return new Bullet(bulletPos.x, bulletPos.y, bulletVel.x, bulletVel.y);
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

  render() {
    // Draw thrust particles first (behind ship)
    for (let p of this.thrustParticles) {
      let alpha = map(p.life, 0, p.maxLife, 0, 255);
      let size = map(p.life, 0, p.maxLife, 1, 4);
      fill(red(color(p.color)), green(color(p.color)), blue(color(p.color)), alpha);
      noStroke();
      ellipse(p.pos.x, p.pos.y, size, size);
    }

    // Draw muzzle flash particles
    for (let p of this.muzzleParticles) {
      let alpha = map(p.life, 0, p.maxLife, 0, 255);
      noStroke();

      // Outer glow (white/yellow)
      fill(255, 255, 200, alpha * 0.3);
      ellipse(p.pos.x, p.pos.y, p.size * 3, p.size * 3);

      // Core (bright white)
      fill(255, 255, 255, alpha);
      ellipse(p.pos.x, p.pos.y, p.size, p.size);
    }

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);

    // Draw ship body
    fill(PALETTE.background);
    stroke(PALETTE.ship);
    strokeWeight(1);

    // Equilateral triangle ship pointing right (rotation 0 = right)
    triangle(
      this.size, 0,
      -this.size * 0.5, -this.size * 0.866,
      -this.size * 0.5, this.size * 0.866
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
  }
}
