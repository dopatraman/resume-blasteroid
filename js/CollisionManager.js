/**
 * CollisionManager - Handles all collision detection
 * Extracted from Game.js for better separation of concerns
 */
class CollisionManager {
  constructor(game) {
    this.game = game;
  }

  // === Bullet-Asteroid Collision ===

  checkBulletAsteroid() {
    for (let i = this.game.bullets.length - 1; i >= 0; i--) {
      for (let j = this.game.asteroids.length - 1; j >= 0; j--) {
        if (this.game.bullets[i] && this.game.bullets[i].hits(this.game.asteroids[j])) {
          let bullet = this.game.bullets[i];
          let asteroid = this.game.asteroids[j];

          // Spawn ricochet bullets for Homing II (but not from ricochets)
          if (bullet.isHomingII && !bullet.isRicochet) {
            let ricochets = this.createRicochetBullets(bullet, asteroid);
            this.game.bullets.push(...ricochets);
          }

          // Create explosion particles
          let explosionParticles = asteroid.explode();
          this.game.particleSystem.particles.push(...explosionParticles);

          // Get asteroid type and position before removing
          let asteroidType = asteroid.type;
          let asteroidPos = asteroid.pos;

          // Award points
          this.game.score += 10;

          // Remove bullet and asteroid
          this.game.bullets.splice(i, 1);
          this.game.asteroids.splice(j, 1);

          // Spawn portal for section asteroids (not neutral)
          if (asteroidType !== 'neutral') {
            this.game.spawnPortal(asteroidPos, asteroidType);
          }
          return;  // Exit after hit
        }
      }
    }
  }

  createRicochetBullets(bullet, asteroid) {
    let ricochets = [];

    // Homing II = 3 ricochets, Homing III = 5 ricochets
    let numRicochets = bullet.homingTier >= 3 ? 5 : 3;

    // Impact direction: from bullet toward asteroid center
    let impactDir = p5.Vector.sub(asteroid.pos, bullet.pos);
    let impactAngle = atan2(impactDir.y, impactDir.x);

    // Create ricochet bullets spread across 120 degree arc
    let angles = [];
    for (let i = 0; i < numRicochets; i++) {
      // Spread from -60 to +60 degrees with slight randomness
      let baseAngle = map(i, 0, numRicochets - 1, -PI / 3, PI / 3);
      angles.push(impactAngle + baseAngle + random(-0.1, 0.1));
    }

    for (let angle of angles) {
      let vel = p5.Vector.fromAngle(angle);
      vel.mult(SHAPES.bullet.speed * 0.8);  // Slightly slower than normal

      let ricochet = new Bullet(
        bullet.pos.x,
        bullet.pos.y,
        vel.x,
        vel.y,
        0.8,  // Slightly smaller
        1     // Tier 1
      );
      ricochet.isRicochet = true;  // Mark to prevent chaining
      ricochets.push(ricochet);
    }

    return ricochets;
  }

  // === Beam-Asteroid Collision ===

  checkBeamAsteroid() {
    for (let beam of this.game.beams) {
      let endPos = p5.Vector.add(beam.startPos, p5.Vector.mult(beam.direction, beam.currentLength));

      for (let j = this.game.asteroids.length - 1; j >= 0; j--) {
        let asteroid = this.game.asteroids[j];

        // Check line-circle collision
        if (this.lineCircleCollision(beam.startPos, endPos, asteroid.pos, asteroid.radius + beam.width / 2)) {
          // Create explosion particles
          let explosionParticles = asteroid.explode();
          this.game.particleSystem.particles.push(...explosionParticles);

          // Get asteroid type and position before removing
          let asteroidType = asteroid.type;
          let asteroidPos = asteroid.pos;

          // Award points
          this.game.score += 10;

          // Remove asteroid (beam doesn't get consumed)
          this.game.asteroids.splice(j, 1);

          // Spawn portal for section asteroids (not neutral)
          if (asteroidType !== 'neutral') {
            this.game.spawnPortal(asteroidPos, asteroidType);
          }
        }
      }
    }
  }

  // === Ship-Asteroid Collision ===

  checkShipAsteroid() {
    if (!this.game.ship) return;

    for (let asteroid of this.game.asteroids) {
      let d = dist(this.game.ship.pos.x, this.game.ship.pos.y, asteroid.pos.x, asteroid.pos.y);
      if (d < asteroid.radius + this.game.ship.size * 0.5) {
        this.game.shipDeath();
        return;
      }
    }
  }

  // === Ship-Portal Collision ===

  checkPortal() {
    if (!this.game.ship) return;

    for (let i = this.game.portals.length - 1; i >= 0; i--) {
      let portal = this.game.portals[i];
      let d = dist(this.game.ship.pos.x, this.game.ship.pos.y, portal.pos.x, portal.pos.y);
      if (d < portal.radius + this.game.ship.size * 0.3) {
        this.game.triggerTransition(portal.type);
        this.game.portals = [];  // Clear all portals on transition
        return;
      }
    }
  }

  // === Bullet-Powerup Collision ===

  checkBulletPowerup() {
    // Check if bullets hit powerups
    for (let i = this.game.bullets.length - 1; i >= 0; i--) {
      for (let j = this.game.powerups.length - 1; j >= 0; j--) {
        if (this.game.powerups[j].hits(this.game.bullets[i])) {
          // Create powerup drop at powerup position
          let powerup = this.game.powerups[j];
          this.game.powerupDrops.push(new PowerupDrop(powerup.pos.x, powerup.pos.y, powerup.type));

          // Remove bullet and powerup
          this.game.bullets.splice(i, 1);
          this.game.powerups.splice(j, 1);
          return;
        }
      }
    }
  }

  // === Ship-PowerupDrop Collision ===

  checkShipPowerupDrop() {
    if (!this.game.ship) return;

    for (let i = this.game.powerupDrops.length - 1; i >= 0; i--) {
      let drop = this.game.powerupDrops[i];
      let d = dist(this.game.ship.pos.x, this.game.ship.pos.y, drop.pos.x, drop.pos.y);
      if (d < drop.radius + this.game.ship.size * 0.5) {
        // Activate powerup
        this.game.activatePowerup(drop.type);
        this.game.powerupDrops.splice(i, 1);
        return;
      }
    }
  }

  // === Plume-Asteroid Collision (Boost I) ===

  checkPlumeAsteroid() {
    if (!this.game.ship) return;

    let particles = this.game.ship.thrustParticles;
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      if (!p.isPlume) continue;  // Only plume particles

      for (let j = this.game.asteroids.length - 1; j >= 0; j--) {
        let asteroid = this.game.asteroids[j];
        let d = dist(p.pos.x, p.pos.y, asteroid.pos.x, asteroid.pos.y);
        let plumeRadius = 6;  // Small collision radius

        if (d < asteroid.radius + plumeRadius) {
          // Explode asteroid
          let explosionParticles = asteroid.explode();
          this.game.particleSystem.particles.push(...explosionParticles);

          // Award points, spawn portal
          let asteroidType = asteroid.type;
          let asteroidPos = asteroid.pos;
          this.game.score += 10;

          this.game.asteroids.splice(j, 1);

          if (asteroidType !== 'neutral') {
            this.game.spawnPortal(asteroidPos, asteroidType);
          }

          // Remove plume particle
          particles.splice(i, 1);
          break;
        }
      }
    }
  }

  // === Plume-Powerup Collision (Boost I) ===

  checkPlumePowerup() {
    if (!this.game.ship) return;

    let particles = this.game.ship.thrustParticles;
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      if (!p.isPlume) continue;

      for (let j = this.game.powerups.length - 1; j >= 0; j--) {
        let powerup = this.game.powerups[j];
        let d = dist(p.pos.x, p.pos.y, powerup.pos.x, powerup.pos.y);
        let plumeRadius = 6;

        if (d < powerup.radius + plumeRadius) {
          // Create powerup drop
          this.game.powerupDrops.push(new PowerupDrop(powerup.pos.x, powerup.pos.y, powerup.type));

          // Remove powerup and particle
          this.game.powerups.splice(j, 1);
          particles.splice(i, 1);
          break;
        }
      }
    }
  }

  // === Geometry Helpers ===

  lineCircleCollision(lineStart, lineEnd, circleCenter, circleRadius) {
    // Vector from line start to end
    let lineVec = p5.Vector.sub(lineEnd, lineStart);
    // Vector from line start to circle center
    let toCircle = p5.Vector.sub(circleCenter, lineStart);

    // Project circle center onto line
    let lineLenSquared = lineVec.magSq();
    if (lineLenSquared === 0) {
      // Line is a point
      return p5.Vector.dist(lineStart, circleCenter) < circleRadius;
    }

    // Parameter t for closest point on line segment
    let t = max(0, min(1, p5.Vector.dot(toCircle, lineVec) / lineLenSquared));

    // Closest point on line segment
    let closest = p5.Vector.add(lineStart, p5.Vector.mult(lineVec, t));

    // Distance from circle center to closest point
    let distance = p5.Vector.dist(closest, circleCenter);

    return distance < circleRadius;
  }
}
