class Powerup {
  constructor(x, y, type) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(0.5, 1.5));
    this.type = type;  // 'homing' for now
    this.radius = 25;
    this.rotation = 0;
    this.rotationSpeed = 0.02;

    // Generate jagged border vertices
    this.numVertices = 8;
    this.baseVertices = this.generateVertices();

    // Color based on type
    this.color = this.getColor();
  }

  getColor() {
    switch (this.type) {
      case 'homing':
        return '#FF00FF';  // Magenta
      case 'chargeshot':
        return '#00FFFF';  // Cyan
      default:
        return '#FF00FF';
    }
  }

  getLabel() {
    switch (this.type) {
      case 'homing':
        return 'H';
      case 'chargeshot':
        return 'C';
      default:
        return '?';
    }
  }

  generateVertices() {
    let vertices = [];
    for (let i = 0; i < this.numVertices; i++) {
      let angle = map(i, 0, this.numVertices, 0, TWO_PI);
      let jaggedness = random(0.7, 1.3);  // Random variation
      vertices.push({
        angle: angle,
        r: this.radius * jaggedness
      });
    }
    return vertices;
  }

  update() {
    this.pos.add(this.vel);
    this.rotation += this.rotationSpeed;
    this.wrapEdges();
  }

  wrapEdges() {
    let buffer = this.radius;
    if (this.pos.x > width + buffer) this.pos.x = -buffer;
    if (this.pos.x < -buffer) this.pos.x = width + buffer;
    if (this.pos.y > height + buffer) this.pos.y = -buffer;
    if (this.pos.y < -buffer) this.pos.y = height + buffer;
  }

  hits(bullet) {
    let d = dist(this.pos.x, this.pos.y, bullet.pos.x, bullet.pos.y);
    return d < this.radius + bullet.radius;
  }

  render() {
    let c = color(this.color);
    let r = red(c), g = green(c), b = blue(c);

    // Pulsing effect
    let pulse = sin(frameCount * 0.1) * 0.2 + 1;

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);

    // Outer glow
    noStroke();
    fill(r, g, b, 30);
    ellipse(0, 0, this.radius * 3 * pulse, this.radius * 3 * pulse);

    // Inner glow
    fill(r, g, b, 50);
    ellipse(0, 0, this.radius * 2 * pulse, this.radius * 2 * pulse);

    // Jagged border
    stroke(r, g, b, 200);
    strokeWeight(2);
    fill(0, 0, 0, 150);

    beginShape();
    for (let v of this.baseVertices) {
      // Animate jaggedness
      let animatedR = v.r + sin(frameCount * 0.15 + v.angle * 2) * 3;
      let x = cos(v.angle) * animatedR;
      let y = sin(v.angle) * animatedR;
      vertex(x, y);
    }
    endShape(CLOSE);

    // Center label
    pop();

    // Draw label (not rotated)
    fill(255, 255, 255, 220);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(14);
    textStyle(BOLD);
    text(this.getLabel(), this.pos.x, this.pos.y);
    textStyle(NORMAL);
  }

  // Static method to spawn from edge
  static spawnFromEdge(type) {
    let edge = floor(random(4));
    let x, y;
    let buffer = 50;

    switch(edge) {
      case 0: // Top
        x = random(width);
        y = -buffer;
        break;
      case 1: // Right
        x = width + buffer;
        y = random(height);
        break;
      case 2: // Bottom
        x = random(width);
        y = height + buffer;
        break;
      case 3: // Left
        x = -buffer;
        y = random(height);
        break;
    }

    return new Powerup(x, y, type);
  }
}
