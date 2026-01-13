/**
 * Bullet Tests
 *
 * Tests for bullet movement, homing, and edge cases.
 */

describe('Bullet Movement', () => {
  it('should move based on velocity', async (ctx) => {
    const bullet = new Bullet(100, 200, 8, 0);
    const startX = bullet.pos.x;

    for (let i = 0; i < 20; i++) {
      bullet.update();

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}`, 20, 30);
        p.text(`X position: ${bullet.pos.x.toFixed(1)}`, 20, 50);

        // Start marker
        p.stroke(100);
        p.noFill();
        p.ellipse(startX, 200, 10, 10);

        bullet.render();
      });
      await ctx.wait(30);
    }

    expect(bullet.pos.x).toBeGreaterThan(startX);
  });

  it('should wrap around screen edges', async (ctx) => {
    const bullet = new Bullet(width - 10, 200, 10, 0);
    let wrapped = false;

    for (let i = 0; i < 20; i++) {
      const beforeX = bullet.pos.x;
      bullet.update();
      const afterX = bullet.pos.x;

      if (beforeX > width - 50 && afterX < 50) {
        wrapped = true;
      }

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}`, 20, 30);
        p.text(`X: ${bullet.pos.x.toFixed(1)}`, 20, 50);
        p.text(`Wrapped: ${wrapped}`, 20, 70);
        bullet.render();
      });
      await ctx.wait(50);
    }

    expect(wrapped).toBe(true);
  });

  it('should decrease lifespan each update', async (ctx) => {
    const bullet = new Bullet(300, 200, 5, 0);
    const initialLifespan = bullet.lifespan;

    for (let i = 0; i < 10; i++) {
      bullet.update();
    }

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Lifespan decrease test', 20, 30);
      p.text(`Initial: ${initialLifespan}`, 20, 50);
      p.text(`After 10 updates: ${bullet.lifespan}`, 20, 70);
      bullet.render();
    });
    await ctx.wait(500);

    expect(bullet.lifespan).toBe(initialLifespan - 10);
  });

  it('should report isDead when lifespan reaches zero', async (ctx) => {
    const bullet = new Bullet(300, 200, 5, 0);
    bullet.lifespan = 5;

    let deadAt = -1;

    for (let i = 0; i < 10; i++) {
      bullet.update();

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}`, 20, 30);
        p.text(`Lifespan: ${bullet.lifespan}`, 20, 50);
        p.text(`isDead: ${bullet.isDead()}`, 20, 70);
        bullet.render();
      });
      await ctx.wait(100);

      if (bullet.isDead() && deadAt === -1) {
        deadAt = i + 1;
      }
    }

    expect(bullet.isDead()).toBe(true);
    expect(deadAt).toBe(5);
  });
});

describe('Bullet Scale and Radius', () => {
  it('should have larger radius with higher scale', async (ctx) => {
    const normalBullet = new Bullet(200, 200, 0, 0, 1);
    const scaledBullet = new Bullet(400, 200, 0, 0, 3);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Scale comparison:', 20, 30);
      p.text(`Scale 1 radius: ${normalBullet.radius.toFixed(1)}`, 20, 50);
      p.text(`Scale 3 radius: ${scaledBullet.radius.toFixed(1)}`, 20, 70);

      normalBullet.render();
      scaledBullet.render();
    });
    await ctx.wait(500);

    expect(scaledBullet.radius).toBeGreaterThan(normalBullet.radius);
  });

  it('should have longer lifespan with higher scale', async (ctx) => {
    const normalBullet = new Bullet(200, 200, 0, 0, 1);
    const scaledBullet = new Bullet(400, 200, 0, 0, 3);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Lifespan comparison:', 20, 30);
      p.text(`Scale 1 lifespan: ${normalBullet.baseLifespan.toFixed(0)}`, 20, 50);
      p.text(`Scale 3 lifespan: ${scaledBullet.baseLifespan.toFixed(0)}`, 20, 70);

      normalBullet.render();
      scaledBullet.render();
    });
    await ctx.wait(500);

    expect(scaledBullet.baseLifespan).toBeGreaterThan(normalBullet.baseLifespan);
  });
});

describe('Bullet Homing', () => {
  it('should find closest asteroid', async (ctx) => {
    const bullet = new Bullet(200, 200, 5, 0);

    const asteroids = [
      new Asteroid(400, 200, 'work', 'medium'),    // Distance 200
      new Asteroid(250, 200, 'about', 'medium'),   // Distance 50 - closest
      new Asteroid(500, 300, 'resume', 'medium')   // Distance 316
    ];

    const closest = bullet.findClosestAsteroid(asteroids);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Find closest asteroid:', 20, 30);
      p.text(`Closest at: (${closest.pos.x}, ${closest.pos.y})`, 20, 50);

      asteroids.forEach(a => a.render());
      bullet.render();

      // Draw lines to all asteroids
      asteroids.forEach(a => {
        p.stroke(a === closest ? '#00FF00' : '#333333');
        p.line(bullet.pos.x, bullet.pos.y, a.pos.x, a.pos.y);
      });
    });
    await ctx.wait(500);

    expect(closest.pos.x).toBe(250);
  });

  it('should steer towards target asteroid', async (ctx) => {
    const bullet = new Bullet(100, 100, 8, 0);  // Moving right
    const target = new Asteroid(100, 300, 'work', 'large');  // Below bullet

    // Initial direction is horizontal
    const initialAngle = atan2(bullet.vel.y, bullet.vel.x);

    // Apply steering for several frames
    for (let i = 0; i < 30; i++) {
      bullet.steerTowards(target);
      bullet.pos.add(bullet.vel);

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}`, 20, 30);
        p.text(`Velocity angle: ${(atan2(bullet.vel.y, bullet.vel.x) * 180 / PI).toFixed(1)}`, 20, 50);

        target.render();
        bullet.render();

        // Draw line to target
        p.stroke(100);
        p.line(bullet.pos.x, bullet.pos.y, target.pos.x, target.pos.y);
      });
      await ctx.wait(30);
    }

    const finalAngle = atan2(bullet.vel.y, bullet.vel.x);

    // Should have turned downward (positive Y direction)
    expect(finalAngle).toBeGreaterThan(initialAngle);
  });

  it('should return null when no asteroids exist', async (ctx) => {
    const bullet = new Bullet(300, 200, 5, 0);
    const closest = bullet.findClosestAsteroid([]);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Find closest with empty array:', 20, 30);
      p.text(`Result: ${closest}`, 20, 50);
      bullet.render();
    });
    await ctx.wait(500);

    expect(closest).toBe(null);
  });
});

describe('Bullet Collision Detection', () => {
  it('should hit asteroid at same position', async (ctx) => {
    const asteroid = new Asteroid(300, 200, 'work', 'medium');
    const bullet = new Bullet(300, 200, 0, 0);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Bullet at asteroid center:', 20, 30);
      p.text(`hits(): ${bullet.hits(asteroid)}`, 20, 50);
      asteroid.render();
      bullet.render();
    });
    await ctx.wait(500);

    expect(bullet.hits(asteroid)).toBe(true);
  });

  it('should not hit asteroid far away', async (ctx) => {
    const asteroid = new Asteroid(300, 200, 'work', 'medium');
    const bullet = new Bullet(100, 100, 0, 0);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Bullet far from asteroid:', 20, 30);
      p.text(`hits(): ${bullet.hits(asteroid)}`, 20, 50);
      asteroid.render();
      bullet.render();
    });
    await ctx.wait(500);

    expect(bullet.hits(asteroid)).toBe(false);
  });

  it('should account for bullet radius in collision', async (ctx) => {
    const asteroid = new Asteroid(300, 200, 'work', 'small');

    // Position exactly at asteroid radius
    const distFromCenter = asteroid.radius;
    const normalBullet = new Bullet(300 + distFromCenter, 200, 0, 0, 1);
    const largeBullet = new Bullet(300 + distFromCenter + 5, 200, 0, 0, 3);

    const normalHits = normalBullet.hits(asteroid);
    const largeHits = largeBullet.hits(asteroid);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Bullet radius affects collision:', 20, 30);
      p.text(`Normal bullet (scale 1) hits: ${normalHits}`, 20, 50);
      p.text(`Large bullet (scale 3) hits: ${largeHits}`, 20, 70);

      // Show collision zones
      p.noFill();
      p.stroke(255, 100);
      p.ellipse(asteroid.pos.x, asteroid.pos.y, (asteroid.radius + normalBullet.radius) * 2);
      p.stroke(0, 255, 255, 100);
      p.ellipse(asteroid.pos.x, asteroid.pos.y, (asteroid.radius + largeBullet.radius) * 2);

      asteroid.render();
    });
    await ctx.wait(500);

    // Large bullet should hit due to larger radius
    expect(largeHits).toBe(true);
  });
});

describe('Bullet Edge Cases', () => {
  it('should handle zero velocity', async (ctx) => {
    const bullet = new Bullet(300, 200, 0, 0);
    const startPos = bullet.pos.copy();

    for (let i = 0; i < 10; i++) {
      bullet.update();
    }

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Zero velocity bullet:', 20, 30);
      p.text(`Start: (${startPos.x}, ${startPos.y})`, 20, 50);
      p.text(`After 10 updates: (${bullet.pos.x}, ${bullet.pos.y})`, 20, 70);
      bullet.render();
    });
    await ctx.wait(500);

    // Position should not change (except for wrapping, which won't happen at 300,200)
    expect(bullet.pos.x).toBe(startPos.x);
    expect(bullet.pos.y).toBe(startPos.y);
  });

  it('should handle negative velocity', async (ctx) => {
    const bullet = new Bullet(300, 200, -5, -3);
    const startX = bullet.pos.x;
    const startY = bullet.pos.y;

    for (let i = 0; i < 10; i++) {
      bullet.update();
    }

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Negative velocity:', 20, 30);
      p.text(`Start: (${startX}, ${startY})`, 20, 50);
      p.text(`Now: (${bullet.pos.x.toFixed(1)}, ${bullet.pos.y.toFixed(1)})`, 20, 70);
      bullet.render();
    });
    await ctx.wait(500);

    expect(bullet.pos.x).toBeLessThan(startX);
    expect(bullet.pos.y).toBeLessThan(startY);
  });

  it('should render differently based on tier', async (ctx) => {
    const tier1Bullet = new Bullet(150, 200, 0, 0, 2, 1);
    const tier2Bullet = new Bullet(300, 200, 0, 0, 2, 2);
    const tier3Bullet = new Bullet(450, 200, 0, 0, 2, 3);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Bullet tiers (visual only):', 20, 30);
      p.text('Tier 1', 130, 260);
      p.text('Tier 2', 280, 260);
      p.text('Tier 3', 430, 260);

      tier1Bullet.render();
      tier2Bullet.render();
      tier3Bullet.render();
    });
    await ctx.wait(500);

    expect(tier1Bullet.tier).toBe(1);
    expect(tier2Bullet.tier).toBe(2);
    expect(tier3Bullet.tier).toBe(3);
  });

  it('should maintain speed during steering', async (ctx) => {
    const bullet = new Bullet(200, 200, 8, 0);
    const target = new Asteroid(200, 350, 'work', 'large');
    const initialSpeed = bullet.vel.mag();

    // Steer for many frames
    for (let i = 0; i < 20; i++) {
      bullet.steerTowards(target);
      bullet.pos.add(bullet.vel);
    }

    const finalSpeed = bullet.vel.mag();

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Speed maintained during steering:', 20, 30);
      p.text(`Initial speed: ${initialSpeed.toFixed(2)}`, 20, 50);
      p.text(`Final speed: ${finalSpeed.toFixed(2)}`, 20, 70);
      target.render();
      bullet.render();
    });
    await ctx.wait(500);

    // Speed should be maintained (within floating point tolerance)
    expect(Math.abs(finalSpeed - initialSpeed)).toBeLessThan(0.01);
  });
});
