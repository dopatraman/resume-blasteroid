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

    return new Bullet(bulletPos.x, bulletPos.y, bulletVel.x, bulletVel.y);
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

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);

    // Draw ship body
    fill(PALETTE.background);
    stroke(PALETTE.ship);
    strokeWeight(1);

    // Simple triangle ship pointing right (rotation 0 = right)
    triangle(
      this.size, 0,
      -this.size, -this.size * 0.7,
      -this.size, this.size * 0.7
    );

    // Draw thrust flame when thrusting
    if (this.isThrusting) {
      fill(PALETTE.shipThrust);
      noStroke();
      beginShape();
      vertex(-this.size, -this.size * 0.25);
      vertex(-this.size * 1.5 - random(5), 0);
      vertex(-this.size, this.size * 0.25);
      endShape(CLOSE);
    }

    pop();
  }
}
