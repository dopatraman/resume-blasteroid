class Bullet {
  constructor(x, y, vx, vy, scale = 1, tier = 1) {
    this.pos = createVector(x, y);
    this.vel = createVector(vx, vy);
    this.scale = scale;
    this.tier = tier;
    this.radius = SHAPES.bullet.radius * scale;
    this.baseLifespan = SHAPES.bullet.lifespan * (1 + scale * 0.3);  // Bigger = longer life
    this.lifespan = this.baseLifespan;
  }

  setGuidedTarget(startPos, targetAsteroid, obstacles = []) {
    // Store references for dynamic tracking
    this.guidedStart = startPos.copy();
    this.guidedTargetAsteroid = targetAsteroid;  // Track the asteroid
    this.guidedObstacles = obstacles.filter(a => a !== targetAsteroid);  // Exclude target
    this.guidedT = 0;  // Progress along curve (0 to 1)
    this.trail = [];  // Trail of recent positions for visual effect

    // Calculate initial curve
    this.updateGuidedCurve();
  }

  updateGuidedCurve() {
    if (!this.guidedTargetAsteroid) return;

    // Get current target point on asteroid border (facing the bullet's start)
    let toAsteroid = p5.Vector.sub(this.guidedTargetAsteroid.pos, this.guidedStart);
    let hitAngle = atan2(toAsteroid.y, toAsteroid.x);
    this.guidedEnd = createVector(
      this.guidedTargetAsteroid.pos.x - cos(hitAngle) * this.guidedTargetAsteroid.radius,
      this.guidedTargetAsteroid.pos.y - sin(hitAngle) * this.guidedTargetAsteroid.radius
    );

    // Calculate how well-aligned bullet is with target
    let toTarget = p5.Vector.sub(this.guidedEnd, this.guidedStart);
    let distance = toTarget.mag();

    let bulletDir = this.vel.copy();
    bulletDir.normalize();
    let targetDir = toTarget.copy();
    targetDir.normalize();
    let alignment = bulletDir.dot(targetDir);  // 1 = perfect, 0 = perpendicular, -1 = opposite

    // Arc height based on alignment:
    // - alignment 1.0 (directly facing) → 5% arc (nearly straight)
    // - alignment 0.5 (60° off) → 25% arc
    // - alignment 0.0 (perpendicular) → 40% arc
    let arcPercent = map(alignment, 1.0, 0.0, 0.05, 0.40);
    arcPercent = constrain(arcPercent, 0.05, 0.40);

    let arcHeight = distance * arcPercent;

    // Recalculate control point for arc
    let midpoint = p5.Vector.lerp(this.guidedStart, this.guidedEnd, 0.5);
    let perpendicular = createVector(-toTarget.y, toTarget.x);
    perpendicular.normalize();

    // Check for obstacles blocking the direct path
    let blockingObstacle = this.findBlockingObstacle(this.guidedStart, this.guidedEnd);

    if (blockingObstacle) {
      // Increase arc height to go around obstacle
      let obstacleRadius = blockingObstacle.radius + 20;  // Buffer
      arcHeight = max(arcHeight, obstacleRadius * 1.5);

      // Choose perpendicular direction that avoids the obstacle
      // Check which side of the path the obstacle center is on
      let toObstacle = p5.Vector.sub(blockingObstacle.pos, this.guidedStart);
      let side = toTarget.x * toObstacle.y - toTarget.y * toObstacle.x;  // Cross product

      // If obstacle is on positive perpendicular side, go negative (and vice versa)
      if (side > 0) {
        perpendicular.mult(-1);
      }
    }

    this.guidedControl = p5.Vector.add(midpoint, p5.Vector.mult(perpendicular, arcHeight));

    // Update speed based on current distance
    let speed = this.vel.mag();
    this.guidedDuration = distance / speed;
    this.guidedSpeed = 1 / this.guidedDuration;
  }

  findBlockingObstacle(start, end) {
    if (!this.guidedObstacles) return null;

    for (let obstacle of this.guidedObstacles) {
      // Line-circle intersection test
      let toEnd = p5.Vector.sub(end, start);
      let toObstacle = p5.Vector.sub(obstacle.pos, start);

      let pathLength = toEnd.mag();
      let projection = toObstacle.dot(toEnd) / pathLength;

      // Check if obstacle is along the path (not behind start or past end)
      if (projection < 0 || projection > pathLength) continue;

      // Find closest point on line to obstacle center
      let closestPoint = p5.Vector.add(start, p5.Vector.mult(toEnd.copy().normalize(), projection));
      let distToPath = p5.Vector.dist(closestPoint, obstacle.pos);

      // If path intersects obstacle (with some margin)
      if (distToPath < obstacle.radius + 15) {
        return obstacle;
      }
    }
    return null;
  }

  update(asteroids = []) {
    // Homing II: follow bezier curve to target
    if (this.guidedEnd) {
      this.followGuidedPath();
    }
    // Normal homing: steer toward nearest asteroid (but not for guided bullets that finished or ricochets)
    else if (asteroids.length > 0 && !this.guidedComplete && !this.isRicochet) {
      let closest = this.findClosestAsteroid(asteroids);
      if (closest) {
        this.steerTowards(closest);
      }
    }

    // Only add velocity if not on guided path (guided path sets position directly)
    if (!this.guidedEnd) {
      this.pos.add(this.vel);
    }
    this.lifespan--;

    // Wrap around edges (only for non-guided bullets)
    if (!this.guidedEnd) {
      if (this.pos.x > width) this.pos.x = 0;
      if (this.pos.x < 0) this.pos.x = width;
      if (this.pos.y > height) this.pos.y = 0;
      if (this.pos.y < 0) this.pos.y = height;
    }
  }

  followGuidedPath() {
    // Recalculate curve every frame to track moving asteroid
    this.updateGuidedCurve();

    // Store position for trail effect (longer trail for Homing II)
    if (this.trail) {
      this.trail.push(this.pos.copy());
      let maxTrailLength = this.isHomingII ? 40 : 25;
      if (this.trail.length > maxTrailLength) this.trail.shift();
    }

    // Advance along the curve
    this.guidedT += this.guidedSpeed;

    if (this.guidedT >= 1) {
      // Reached target - snap to exact position
      this.pos.x = this.guidedEnd.x;
      this.pos.y = this.guidedEnd.y;
      this.guidedComplete = true;  // Mark as done so normal homing doesn't kick in
      this.guidedTargetAsteroid = null;  // Clear asteroid reference
      this.guidedEnd = null;  // Stop guided mode
      return;
    }

    // Quadratic bezier: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
    let t = this.guidedT;
    let mt = 1 - t;

    this.pos.x = mt * mt * this.guidedStart.x + 2 * mt * t * this.guidedControl.x + t * t * this.guidedEnd.x;
    this.pos.y = mt * mt * this.guidedStart.y + 2 * mt * t * this.guidedControl.y + t * t * this.guidedEnd.y;
  }

  isDead() {
    return this.lifespan <= 0;
  }

  findClosestAsteroid(asteroids) {
    let closest = null;
    let closestDist = Infinity;

    for (let asteroid of asteroids) {
      let d = dist(this.pos.x, this.pos.y, asteroid.pos.x, asteroid.pos.y);
      if (d < closestDist) {
        closestDist = d;
        closest = asteroid;
      }
    }

    return closest;
  }

  steerTowards(target) {
    let speed = this.vel.mag();  // Save original speed

    // Calculate desired direction to target
    let desired = p5.Vector.sub(target.pos, this.pos);
    desired.setMag(speed);

    // Steering force = desired - current velocity
    let steer = p5.Vector.sub(desired, this.vel);
    let maxSteer = 0.3;  // Limit turn rate for smooth curve
    steer.limit(maxSteer);

    // Apply steering and restore speed
    this.vel.add(steer);
    this.vel.setMag(speed);  // Maintain constant speed
  }

  steerTowardsPoint(targetPoint) {
    let speed = this.vel.mag();

    // Calculate desired direction to target point
    let desired = p5.Vector.sub(targetPoint, this.pos);
    desired.setMag(speed);

    // Steering force = desired - current velocity
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(0.3);  // Same turn rate as normal homing

    // Apply steering and restore speed
    this.vel.add(steer);
    this.vel.setMag(speed);
  }

  hits(asteroid) {
    let d = dist(this.pos.x, this.pos.y, asteroid.pos.x, asteroid.pos.y);
    return d < asteroid.radius + this.radius;  // Include bullet radius for charged shots
  }

  render() {
    // Draw shimmering trail for guided bullets
    if (this.trail && this.trail.length > 0) {
      for (let i = 0; i < this.trail.length; i++) {
        let progress = i / this.trail.length;  // 0 = oldest, 1 = newest
        let trailAlpha = map(progress, 0, 1, 30, 180);
        let size = map(progress, 0, 1, 2, 5);

        // More dramatic shimmer for Homing II
        let shimmerSpeed = this.isHomingII ? 0.8 : 0.4;
        let shimmerAmp = this.isHomingII ? 0.5 : 0.4;
        let shimmer = sin(frameCount * shimmerSpeed + i * 0.8) * shimmerAmp + (1 - shimmerAmp);

        // Color: Homing II gets cyan-magenta color shift, Homing I stays golden
        let r = 255;
        let g, b;
        if (this.isHomingII) {
          let colorShift = sin(frameCount * 0.3 + i * 0.5);
          g = map(shimmer, 0.2, 1.0, 100, 255);
          b = map(colorShift, -1, 1, 100, 255);  // Shifts cyan to magenta
        } else {
          g = map(shimmer, 0.2, 1.0, 180, 255);
          b = map(shimmer, 0.2, 1.0, 50, 150);
        }

        noStroke();
        // Outer glow (larger for Homing II)
        // For Homing II: solid trail (no shimmer), Homing I: shimmer
        let mainTrailShimmer = this.isHomingII ? 1.0 : shimmer;
        let glowMult = this.isHomingII ? 4 : 3;
        fill(r, g, b, trailAlpha * 0.3 * mainTrailShimmer);
        ellipse(this.trail[i].x, this.trail[i].y, size * glowMult, size * glowMult);
        // Inner bright core
        fill(r, g, b, trailAlpha * mainTrailShimmer);
        ellipse(this.trail[i].x, this.trail[i].y, size, size);

        // Ember-like particles for Homing II - drift and dissipate like embers
        if (this.isHomingII) {
          for (let e = 0; e < 4; e++) {
            // Each ember has its own lifecycle based on frame, trail position, and ember index
            let emberAge = (frameCount * 0.02 + i * 0.15 + e * 0.5) % 1;  // 0-1 lifecycle
            let drift = emberAge * 25;  // Drift distance increases with age
            let driftAngle = (i * 2.3 + e * 1.7);  // Pseudo-random angle per ember

            let emberX = this.trail[i].x + cos(driftAngle) * drift + sin(frameCount * 0.08 + e) * 5;
            let emberY = this.trail[i].y + sin(driftAngle) * drift - emberAge * 15;  // Rise upward

            // Fade out as ember ages - higher base alpha
            let emberAlpha = (1 - emberAge * 0.7) * 200 * shimmer;

            // Size shrinks as it ages - larger starting size
            let emberSize = map(emberAge, 0, 1, 5, 1);

            // Golden/cyan/white colors (not red)
            if (e === 0) fill(255, 220, 100, emberAlpha);      // Golden
            else if (e === 1) fill(200, 255, 255, emberAlpha); // Cyan-white
            else if (e === 2) fill(255, 180, 255, emberAlpha); // Pink-white
            else fill(255, 255, 255, emberAlpha);              // White

            ellipse(emberX, emberY, emberSize, emberSize);
          }
        }
      }
    }

    // Fade out as lifespan decreases
    let alpha = map(this.lifespan, 0, this.baseLifespan, 100, 255);

    if (this.scale > 1.5) {
      // Enhanced glow for charged shots
      let c = color(PALETTE.ship);
      let r = red(c), g = green(c), b = blue(c);

      // Tier 2+ pulsing cyan halo
      if (this.tier >= 2) {
        let cyanPulse = sin(frameCount * 0.15) * 0.3 + 1;
        noFill();
        stroke(0, 255, 255, alpha * 0.5);
        strokeWeight(2);
        ellipse(this.pos.x, this.pos.y, this.radius * 6 * cyanPulse, this.radius * 6 * cyanPulse);
        stroke(0, 255, 255, alpha * 0.3);
        strokeWeight(1);
        ellipse(this.pos.x, this.pos.y, this.radius * 8 * cyanPulse, this.radius * 8 * cyanPulse);
      }

      // Outer glow (ship color)
      fill(r, g, b, alpha * 0.15);
      noStroke();
      ellipse(this.pos.x, this.pos.y, this.radius * 6, this.radius * 6);

      // Middle glow (ship color)
      fill(r, g, b, alpha * 0.3);
      ellipse(this.pos.x, this.pos.y, this.radius * 4, this.radius * 4);

      // Tier 2+ cyan tint layer
      if (this.tier >= 2) {
        fill(0, 255, 255, alpha * 0.15);
        ellipse(this.pos.x, this.pos.y, this.radius * 5, this.radius * 5);
      }

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
