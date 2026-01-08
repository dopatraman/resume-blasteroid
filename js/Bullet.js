class Bullet {
  constructor(x, y, vx, vy) {
    this.pos = createVector(x, y);
    this.vel = createVector(vx, vy);
    this.radius = SHAPES.bullet.radius;
    this.lifespan = SHAPES.bullet.lifespan;
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
    return d < asteroid.radius;
  }

  render() {
    // Fade out as lifespan decreases
    let alpha = map(this.lifespan, 0, SHAPES.bullet.lifespan, 100, 255);

    fill(255, 255, 255, alpha);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);

    // Add glow effect
    fill(255, 255, 255, alpha * 0.3);
    ellipse(this.pos.x, this.pos.y, this.radius * 4, this.radius * 4);
  }
}
