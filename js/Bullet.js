class Bullet {
  constructor(x, y, vx, vy, scale = 1) {
    this.pos = createVector(x, y);
    this.vel = createVector(vx, vy);
    this.scale = scale;
    this.radius = SHAPES.bullet.radius * scale;
    this.baseLifespan = SHAPES.bullet.lifespan * (1 + scale * 0.3);  // Bigger = longer life
    this.lifespan = this.baseLifespan;
  }

  update() {
    this.pos.add(this.vel);
    this.lifespan--;

    // Wrap around edges
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = height;
  }

  isDead() {
    return this.lifespan <= 0;
  }

  hits(asteroid) {
    let d = dist(this.pos.x, this.pos.y, asteroid.pos.x, asteroid.pos.y);
    return d < asteroid.radius + this.radius;  // Include bullet radius for charged shots
  }

  render() {
    // Fade out as lifespan decreases
    let alpha = map(this.lifespan, 0, this.baseLifespan, 100, 255);

    if (this.scale > 1.5) {
      // Enhanced glow for charged shots
      let c = color(PALETTE.ship);
      let r = red(c), g = green(c), b = blue(c);

      // Outer glow (ship color)
      fill(r, g, b, alpha * 0.15);
      noStroke();
      ellipse(this.pos.x, this.pos.y, this.radius * 6, this.radius * 6);

      // Middle glow (ship color)
      fill(r, g, b, alpha * 0.3);
      ellipse(this.pos.x, this.pos.y, this.radius * 4, this.radius * 4);

      // Inner glow (yellowish)
      fill(255, 255, 200, alpha * 0.6);
      ellipse(this.pos.x, this.pos.y, this.radius * 2.5, this.radius * 2.5);

      // Bright core
      fill(255, 255, 255, alpha);
      ellipse(this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);

      // White-hot center
      fill(255, 255, 255, alpha);
      ellipse(this.pos.x, this.pos.y, this.radius, this.radius);
    } else {
      // Normal bullet rendering
      fill(255, 255, 255, alpha);
      noStroke();
      ellipse(this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);

      // Add glow effect
      fill(255, 255, 255, alpha * 0.3);
      ellipse(this.pos.x, this.pos.y, this.radius * 4, this.radius * 4);
    }
  }
}
