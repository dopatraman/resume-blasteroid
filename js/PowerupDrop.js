class PowerupDrop {
  constructor(x, y, type) {
    this.pos = createVector(x, y);
    this.type = type;
    this.radius = 30;
    this.life = 300;      // 5 seconds at 60fps
    this.maxLife = 300;

    // Color based on type
    this.color = this.getColor();

    // Generate jagged border vertices
    this.numVertices = 10;
    this.baseVertices = this.generateVertices();
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
        return 'Homing';
      case 'chargeshot':
        return 'Charge';
      default:
        return '???';
    }
  }

  generateVertices() {
    let vertices = [];
    for (let i = 0; i < this.numVertices; i++) {
      let angle = map(i, 0, this.numVertices, 0, TWO_PI);
      let jaggedness = random(0.7, 1.3);
      vertices.push({
        angle: angle,
        r: jaggedness
      });
    }
    return vertices;
  }

  update() {
    this.life--;
  }

  isDead() {
    return this.life <= 0;
  }

  drawJaggedShape(size, fillColor, strokeColor, strokeW) {
    if (fillColor) {
      fill(fillColor);
    } else {
      noFill();
    }
    if (strokeColor) {
      stroke(strokeColor);
      strokeWeight(strokeW || 1);
    } else {
      noStroke();
    }

    beginShape();
    for (let v of this.baseVertices) {
      // Animate jaggedness
      let animatedR = v.r + sin(frameCount * 0.12 + v.angle * 3) * 0.15;
      let x = this.pos.x + cos(v.angle) * size * animatedR;
      let y = this.pos.y + sin(v.angle) * size * animatedR;
      vertex(x, y);
    }
    endShape(CLOSE);
  }

  render() {
    let c = color(this.color);
    let r = red(c), g = green(c), b = blue(c);

    // Fade out as life decreases
    let alpha = map(this.life, 0, this.maxLife, 0, 255);

    // Pulsing effect
    let pulse = sin(frameCount * 0.15) * 0.15 + 1;
    let size = this.radius * pulse;

    // Outer glow (jagged)
    this.drawJaggedShape(size * 2.5, color(r, g, b, alpha * 0.1), null);

    // Middle layer (jagged)
    this.drawJaggedShape(size * 1.8, color(r, g, b, alpha * 0.2), null);

    // Inner layer (jagged)
    this.drawJaggedShape(size * 1.3, color(r, g, b, alpha * 0.35), null);

    // Core (jagged)
    this.drawJaggedShape(size * 0.9, color(255, 255, 255, alpha * 0.4), null);

    // Jagged outline rings
    this.drawJaggedShape(size * 1.8, null, color(r, g, b, alpha * 0.5), 2);
    this.drawJaggedShape(size * 1.3, null, color(r, g, b, alpha * 0.8), 1);

    // "Collect" label
    let labelAlpha = alpha * (0.5 + sin(frameCount * 0.1) * 0.3);
    fill(255, 255, 255, labelAlpha);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(10);
    text('Collect', this.pos.x, this.pos.y);
  }
}
