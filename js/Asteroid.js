class Asteroid {
  constructor(x, y, type, sizeKey = 'large') {
    this.pos = createVector(x, y);
    this.type = type;  // 'work', 'about', 'resume'
    this.sizeKey = sizeKey;
    this.radius = SHAPES.asteroidSizes[sizeKey];

    // Random velocity
    let speed = map(this.radius, 35, 70, 1.5, 0.8);  // Smaller = faster
    let angle = random(TWO_PI);
    this.vel = p5.Vector.fromAngle(angle).mult(speed);

    // Rotation
    this.rotation = random(TWO_PI);
    this.rotationSpeed = random(-0.02, 0.02);

    // Generate asteroid shape vertices
    this.vertices = this.generateVertices();

    // Color based on type
    this.color = PALETTE.asteroids[type];

    // Label
    this.label = type.toUpperCase();
  }

  generateVertices() {
    let vertices = [];
    let shapeConfig = SHAPES.asteroids[this.type];
    let numVertices = shapeConfig.vertices;
    let jaggedness = shapeConfig.jaggedness;

    for (let i = 0; i < numVertices; i++) {
      let angle = map(i, 0, numVertices, 0, TWO_PI);
      let r = this.radius * (1 + random(-jaggedness, jaggedness));
      vertices.push({
        angle: angle,
        r: r
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

  render() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);

    // Draw asteroid shape
    fill(PALETTE.background);
    stroke(this.color);
    strokeWeight(1);

    beginShape();
    for (let v of this.vertices) {
      let x = cos(v.angle) * v.r;
      let y = sin(v.angle) * v.r;
      vertex(x, y);
    }
    endShape(CLOSE);

    pop();
  }

  // Create explosion particles when destroyed
  explode() {
    let particles = [];
    let numParticles = 15;

    for (let i = 0; i < numParticles; i++) {
      let angle = random(TWO_PI);
      let speed = random(1, 4);
      particles.push({
        pos: this.pos.copy(),
        vel: p5.Vector.fromAngle(angle).mult(speed),
        life: random(20, 40),
        maxLife: 40,
        color: this.color,
        size: random(2, 6)
      });
    }
    return particles;
  }

  // Static method to spawn asteroid from edge
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

    let sizes = ['small', 'medium', 'large'];
    let sizeKey = random(sizes);

    return new Asteroid(x, y, type, sizeKey);
  }
}
