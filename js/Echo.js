/**
 * Echo - Boost III projectile
 * A cyan arc that flies forward and destroys asteroids
 * Same size/shape as Boost III forcefield, fast decay, no trail
 */
class Echo {
  constructor(x, y, rotation, vel, shipSize) {
    this.pos = createVector(x, y);
    this.vel = vel.copy();
    this.rotation = rotation;

    // Arc properties (match Boost III forcefield exactly)
    this.arcAngle = PI * 90 / 180;  // 90 degrees each side = 180° total
    this.arcRadius = shipSize * 1.5 * 2.5;  // Same as forcefield: size * 1.5 * 2.5

    // Lifecycle - fast decay (~0.5-0.75s)
    this.life = 40;  // ~0.67 seconds at 60fps
    this.maxLife = 40;
    this.alpha = 255;
  }

  update() {
    // Move forward
    this.pos.add(this.vel);

    // Fade out over time
    this.alpha = map(this.life, 0, this.maxLife, 0, 255);
    this.life--;
  }

  isDead() {
    return this.life <= 0;
  }

  render() {
    let arcStart = this.rotation - this.arcAngle;
    let arcEnd = this.rotation + this.arcAngle;

    push();
    translate(this.pos.x, this.pos.y);
    noFill();

    // Outer glow
    stroke(0, 255, 255, this.alpha * 0.2);
    strokeWeight(12);
    arc(0, 0, this.arcRadius * 2, this.arcRadius * 2, arcStart, arcEnd);

    // Middle glow
    stroke(0, 255, 255, this.alpha * 0.4);
    strokeWeight(6);
    arc(0, 0, this.arcRadius * 2, this.arcRadius * 2, arcStart, arcEnd);

    // Core arc
    stroke(0, 255, 255, this.alpha * 0.8);
    strokeWeight(2);
    arc(0, 0, this.arcRadius * 2, this.arcRadius * 2, arcStart, arcEnd);

    // Bright inner edge
    stroke(255, 255, 255, this.alpha * 0.5);
    strokeWeight(1);
    arc(0, 0, this.arcRadius * 1.8, this.arcRadius * 1.8, arcStart, arcEnd);

    pop();
  }
}
