/**
 * Collision Tests
 *
 * Tests for bullet-asteroid collision detection.
 */

describe('Bullet-Asteroid Collision', () => {
  it('should detect collision when bullet hits asteroid', async (ctx) => {
    // Create asteroid at center
    const asteroid = new Asteroid(300, 200, 'work', 'medium');

    // Create bullet at same position (definite hit)
    const bullet = new Bullet(300, 200, 0, 0);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Bullet inside asteroid - should collide', 20, 30);
      p.text(`Distance: ${dist(bullet.pos.x, bullet.pos.y, asteroid.pos.x, asteroid.pos.y).toFixed(1)}`, 20, 50);
      p.text(`Combined radius: ${(asteroid.radius + bullet.radius).toFixed(1)}`, 20, 70);
      asteroid.render();
      bullet.render();
    });
    await ctx.wait(500);

    expect(bullet.hits(asteroid)).toBe(true);
  });

  it('should not detect collision when bullet misses asteroid', async (ctx) => {
    // Create asteroid at center
    const asteroid = new Asteroid(300, 200, 'work', 'medium');

    // Create bullet far away
    const bullet = new Bullet(100, 100, 0, 0);

    const distance = dist(bullet.pos.x, bullet.pos.y, asteroid.pos.x, asteroid.pos.y);
    const combinedRadius = asteroid.radius + bullet.radius;

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Bullet far from asteroid - no collision', 20, 30);
      p.text(`Distance: ${distance.toFixed(1)}`, 20, 50);
      p.text(`Combined radius: ${combinedRadius.toFixed(1)}`, 20, 70);

      // Draw line between them
      p.stroke(50);
      p.line(bullet.pos.x, bullet.pos.y, asteroid.pos.x, asteroid.pos.y);

      asteroid.render();
      bullet.render();
    });
    await ctx.wait(500);

    expect(bullet.hits(asteroid)).toBe(false);
  });

  it('should detect collision at edge of asteroid radius', async (ctx) => {
    // Create asteroid at center
    const asteroid = new Asteroid(300, 200, 'about', 'large');

    // Position bullet just at the edge of collision range
    const collisionDist = asteroid.radius + SHAPES.bullet.radius - 1; // Just inside
    const bullet = new Bullet(300 + collisionDist, 200, 0, 0);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Bullet at edge of asteroid - should collide', 20, 30);
      p.text(`Distance: ${dist(bullet.pos.x, bullet.pos.y, asteroid.pos.x, asteroid.pos.y).toFixed(1)}`, 20, 50);
      p.text(`Combined radius: ${(asteroid.radius + bullet.radius).toFixed(1)}`, 20, 70);

      // Show collision boundary
      p.noFill();
      p.stroke(255, 0, 0, 100);
      p.ellipse(asteroid.pos.x, asteroid.pos.y, (asteroid.radius + bullet.radius) * 2);

      asteroid.render();
      bullet.render();
    });
    await ctx.wait(500);

    expect(bullet.hits(asteroid)).toBe(true);
  });

  it('should not collide when bullet is just outside range', async (ctx) => {
    // Create asteroid at center
    const asteroid = new Asteroid(300, 200, 'resume', 'large');

    // Position bullet just outside collision range
    const missDistance = asteroid.radius + SHAPES.bullet.radius + 5; // Just outside
    const bullet = new Bullet(300 + missDistance, 200, 0, 0);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Bullet just outside range - no collision', 20, 30);
      p.text(`Distance: ${dist(bullet.pos.x, bullet.pos.y, asteroid.pos.x, asteroid.pos.y).toFixed(1)}`, 20, 50);
      p.text(`Combined radius: ${(asteroid.radius + bullet.radius).toFixed(1)}`, 20, 70);

      // Show collision boundary
      p.noFill();
      p.stroke(255, 0, 0, 100);
      p.ellipse(asteroid.pos.x, asteroid.pos.y, (asteroid.radius + bullet.radius) * 2);

      asteroid.render();
      bullet.render();
    });
    await ctx.wait(500);

    expect(bullet.hits(asteroid)).toBe(false);
  });
});

describe('Neutral Asteroid Collision', () => {
  it('should detect collision with neutral asteroid', async (ctx) => {
    // Create neutral asteroid
    const asteroid = new Asteroid(300, 200, 'neutral', 'medium');

    // Create bullet at asteroid position
    const bullet = new Bullet(300, 200, 0, 0);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Neutral asteroid (gray) - collision test', 20, 30);
      p.text(`Asteroid type: ${asteroid.type}`, 20, 50);
      asteroid.render();
      bullet.render();
    });
    await ctx.wait(500);

    expect(asteroid.type).toBe('neutral');
    expect(bullet.hits(asteroid)).toBe(true);
  });

  it('should collide with neutral asteroid same as non-neutral', async (ctx) => {
    // Create both neutral and non-neutral asteroids at same size
    const neutralAsteroid = new Asteroid(200, 200, 'neutral', 'medium');
    const workAsteroid = new Asteroid(400, 200, 'work', 'medium');

    // Position bullets at same relative distance from each
    const testDistance = 40;
    const neutralBullet = new Bullet(200 + testDistance, 200, 0, 0);
    const workBullet = new Bullet(400 + testDistance, 200, 0, 0);

    const neutralHits = neutralBullet.hits(neutralAsteroid);
    const workHits = workBullet.hits(workAsteroid);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Comparing neutral vs non-neutral collision', 20, 30);
      p.text(`Neutral (gray) hits: ${neutralHits}`, 20, 50);
      p.text(`Work (orange) hits: ${workHits}`, 20, 70);

      neutralAsteroid.render();
      workAsteroid.render();
      neutralBullet.render();
      workBullet.render();
    });
    await ctx.wait(500);

    // Both should behave the same way
    expect(neutralHits).toBe(workHits);
  });
});

describe('Non-Neutral Asteroid Collision', () => {
  it('should detect collision with work asteroid', async (ctx) => {
    const asteroid = new Asteroid(300, 200, 'work', 'medium');
    const bullet = new Bullet(300, 200, 0, 0);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Work asteroid (orange) collision', 20, 30);
      p.text(`Type: ${asteroid.type}`, 20, 50);
      asteroid.render();
      bullet.render();
    });
    await ctx.wait(400);

    expect(asteroid.type).toBe('work');
    expect(bullet.hits(asteroid)).toBe(true);
  });

  it('should detect collision with about asteroid', async (ctx) => {
    const asteroid = new Asteroid(300, 200, 'about', 'medium');
    const bullet = new Bullet(300, 200, 0, 0);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('About asteroid (teal) collision', 20, 30);
      p.text(`Type: ${asteroid.type}`, 20, 50);
      asteroid.render();
      bullet.render();
    });
    await ctx.wait(400);

    expect(asteroid.type).toBe('about');
    expect(bullet.hits(asteroid)).toBe(true);
  });

  it('should detect collision with resume asteroid', async (ctx) => {
    const asteroid = new Asteroid(300, 200, 'resume', 'medium');
    const bullet = new Bullet(300, 200, 0, 0);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Resume asteroid (yellow) collision', 20, 30);
      p.text(`Type: ${asteroid.type}`, 20, 50);
      asteroid.render();
      bullet.render();
    });
    await ctx.wait(400);

    expect(asteroid.type).toBe('resume');
    expect(bullet.hits(asteroid)).toBe(true);
  });

  it('should animate bullet traveling toward asteroid and hitting', async (ctx) => {
    const asteroid = new Asteroid(400, 200, 'work', 'large');

    // Fire bullet from left side toward asteroid
    const bulletSpeed = 8;
    const bullet = new Bullet(100, 200, bulletSpeed, 0);

    let hasCollided = false;

    // Animate until collision or timeout
    for (let i = 0; i < 60 && !hasCollided; i++) {
      bullet.update();

      if (bullet.hits(asteroid)) {
        hasCollided = true;
      }

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}: Bullet traveling toward asteroid`, 20, 30);
        p.text(`Bullet position: (${bullet.pos.x.toFixed(0)}, ${bullet.pos.y.toFixed(0)})`, 20, 50);
        p.text(`Distance to asteroid: ${dist(bullet.pos.x, bullet.pos.y, asteroid.pos.x, asteroid.pos.y).toFixed(0)}`, 20, 70);

        if (hasCollided) {
          p.fill(255, 0, 0);
          p.text('COLLISION DETECTED!', 20, 100);
        }

        // Draw trajectory line
        p.stroke(50);
        p.line(100, 200, asteroid.pos.x, asteroid.pos.y);

        asteroid.render();
        bullet.render();
      });
      await ctx.wait(30);
    }

    expect(hasCollided).toBe(true);
  });
});

describe('Charged Bullet Collision', () => {
  it('should have larger collision radius for charged bullets', async (ctx) => {
    const asteroid = new Asteroid(300, 200, 'work', 'medium');

    // Normal bullet
    const normalBullet = new Bullet(300 + asteroid.radius + 5, 200, 0, 0, 1);

    // Charged bullet (scale = 3)
    const chargedBullet = new Bullet(300 + asteroid.radius + 5, 200, 0, 0, 3);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Charged vs normal bullet radius', 20, 30);
      p.text(`Normal bullet radius: ${normalBullet.radius.toFixed(1)}`, 20, 50);
      p.text(`Charged bullet radius: ${chargedBullet.radius.toFixed(1)}`, 20, 70);
      p.text(`Normal hits: ${normalBullet.hits(asteroid)}`, 20, 90);
      p.text(`Charged hits: ${chargedBullet.hits(asteroid)}`, 20, 110);

      // Show both collision zones
      p.noFill();
      p.stroke(255, 255, 255, 50);
      p.ellipse(asteroid.pos.x, asteroid.pos.y, (asteroid.radius + normalBullet.radius) * 2);
      p.stroke(255, 255, 0, 100);
      p.ellipse(asteroid.pos.x, asteroid.pos.y, (asteroid.radius + chargedBullet.radius) * 2);

      asteroid.render();
    });
    await ctx.wait(600);

    // Charged bullet should have larger radius
    expect(chargedBullet.radius).toBeGreaterThan(normalBullet.radius);
  });

  it('should hit asteroid that normal bullet would miss', async (ctx) => {
    const asteroid = new Asteroid(300, 200, 'about', 'small');

    // Position where only charged bullet will hit
    const testDist = asteroid.radius + SHAPES.bullet.radius + 3;

    const normalBullet = new Bullet(300 + testDist, 200, 0, 0, 1);
    const chargedBullet = new Bullet(300 + testDist, 200, 0, 0, 3);

    const normalHits = normalBullet.hits(asteroid);
    const chargedHits = chargedBullet.hits(asteroid);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Charged bullet reaches further', 20, 30);
      p.text(`Test distance: ${testDist.toFixed(1)}`, 20, 50);
      p.text(`Normal bullet hits: ${normalHits}`, 20, 70);
      p.text(`Charged bullet hits: ${chargedHits}`, 20, 90);

      // Visual of normal bullet position
      p.push();
      p.translate(300 + testDist, 150);
      p.fill(255);
      p.noStroke();
      p.ellipse(0, 0, normalBullet.radius * 2);
      p.fill(100);
      p.text('Normal', -20, -15);
      p.pop();

      // Visual of charged bullet
      p.push();
      p.translate(300 + testDist, 250);
      chargedBullet.pos.y = 250;
      chargedBullet.render();
      p.fill(100);
      p.text('Charged', -25, 30);
      p.pop();

      asteroid.render();
    });
    await ctx.wait(600);

    // Normal misses, charged hits
    expect(normalHits).toBe(false);
    expect(chargedHits).toBe(true);
  });
});
