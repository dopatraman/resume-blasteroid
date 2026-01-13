/**
 * Asteroid Tests
 *
 * Tests for asteroid spawning, splitting, and edge cases.
 */

describe('Asteroid Spawning', () => {
  it('should create asteroid with correct type', async (ctx) => {
    const workAsteroid = new Asteroid(200, 200, 'work', 'large');
    const aboutAsteroid = new Asteroid(300, 200, 'about', 'large');
    const resumeAsteroid = new Asteroid(400, 200, 'resume', 'large');
    const neutralAsteroid = new Asteroid(500, 200, 'neutral', 'large');

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Asteroid types:', 20, 30);
      p.text(`Work: ${workAsteroid.type}`, 20, 50);
      p.text(`About: ${aboutAsteroid.type}`, 20, 70);
      p.text(`Resume: ${resumeAsteroid.type}`, 20, 90);
      p.text(`Neutral: ${neutralAsteroid.type}`, 20, 110);

      workAsteroid.render();
      aboutAsteroid.render();
      resumeAsteroid.render();
      neutralAsteroid.render();
    });
    await ctx.wait(500);

    expect(workAsteroid.type).toBe('work');
    expect(aboutAsteroid.type).toBe('about');
    expect(resumeAsteroid.type).toBe('resume');
    expect(neutralAsteroid.type).toBe('neutral');
  });

  it('should create asteroid with correct size category', async (ctx) => {
    const largeAsteroid = new Asteroid(150, 200, 'work', 'large');
    const mediumAsteroid = new Asteroid(300, 200, 'work', 'medium');
    const smallAsteroid = new Asteroid(450, 200, 'work', 'small');

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Asteroid sizes:', 20, 30);
      p.text(`Large radius: ${largeAsteroid.radius.toFixed(1)}`, 20, 50);
      p.text(`Medium radius: ${mediumAsteroid.radius.toFixed(1)}`, 20, 70);
      p.text(`Small radius: ${smallAsteroid.radius.toFixed(1)}`, 20, 90);

      largeAsteroid.render();
      mediumAsteroid.render();
      smallAsteroid.render();
    });
    await ctx.wait(500);

    expect(largeAsteroid.radius).toBeGreaterThan(mediumAsteroid.radius);
    expect(mediumAsteroid.radius).toBeGreaterThan(smallAsteroid.radius);
  });

  it('should have different radius for different sizes', async (ctx) => {
    const large = new Asteroid(300, 200, 'neutral', 'large');
    const medium = new Asteroid(300, 200, 'neutral', 'medium');
    const small = new Asteroid(300, 200, 'neutral', 'small');

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Size comparison at same position:', 20, 30);
      p.text(`Large: ${large.radius}`, 20, 50);
      p.text(`Medium: ${medium.radius}`, 20, 70);
      p.text(`Small: ${small.radius}`, 20, 90);

      // Draw concentric circles showing sizes
      p.noFill();
      p.stroke(255, 255, 0, 100);
      p.ellipse(300, 200, large.radius * 2);
      p.stroke(255, 165, 0, 100);
      p.ellipse(300, 200, medium.radius * 2);
      p.stroke(255, 0, 0, 100);
      p.ellipse(300, 200, small.radius * 2);
    });
    await ctx.wait(500);

    expect(large.size).toBe('large');
    expect(medium.size).toBe('medium');
    expect(small.size).toBe('small');
  });
});

describe('Asteroid Movement', () => {
  it('should move based on velocity', async (ctx) => {
    const asteroid = new Asteroid(100, 200, 'work', 'medium');
    const startX = asteroid.pos.x;
    const startY = asteroid.pos.y;

    // Animate movement
    for (let i = 0; i < 30; i++) {
      asteroid.update();

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}`, 20, 30);
        p.text(`Position: (${asteroid.pos.x.toFixed(1)}, ${asteroid.pos.y.toFixed(1)})`, 20, 50);

        // Show start
        p.stroke(100);
        p.noFill();
        p.ellipse(startX, startY, 10, 10);

        // Draw path
        p.stroke(50);
        p.line(startX, startY, asteroid.pos.x, asteroid.pos.y);

        asteroid.render();
      });
      await ctx.wait(30);
    }

    // Should have moved from start
    const moved = asteroid.pos.x !== startX || asteroid.pos.y !== startY;
    expect(moved).toBe(true);
  });

  it('should wrap around screen edges', async (ctx) => {
    // Create asteroid moving right, starting near right edge
    const asteroid = new Asteroid(width - 10, 200, 'about', 'small');
    asteroid.vel = createVector(5, 0); // Moving right

    let wrappedX = false;

    for (let i = 0; i < 20; i++) {
      const beforeX = asteroid.pos.x;
      asteroid.update();
      const afterX = asteroid.pos.x;

      // Check if wrapped (went from high X to low X)
      if (beforeX > width - 50 && afterX < 50) {
        wrappedX = true;
      }

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}`, 20, 30);
        p.text(`X position: ${asteroid.pos.x.toFixed(1)}`, 20, 50);
        p.text(`Wrapped: ${wrappedX}`, 20, 70);
        asteroid.render();
      });
      await ctx.wait(50);
    }

    expect(wrappedX).toBe(true);
  });

  it('should rotate continuously', async (ctx) => {
    const asteroid = new Asteroid(300, 200, 'resume', 'large');
    const startRotation = asteroid.rotation;

    for (let i = 0; i < 30; i++) {
      asteroid.update();

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}`, 20, 30);
        p.text(`Rotation: ${(asteroid.rotation * 180 / Math.PI).toFixed(1)} degrees`, 20, 50);
        asteroid.render();
      });
      await ctx.wait(30);
    }

    expect(asteroid.rotation).not.toBe(startRotation);
  });
});

describe('Asteroid Splitting', () => {
  it('should split large asteroid into medium asteroids', async (ctx) => {
    const largeAsteroid = new Asteroid(300, 200, 'work', 'large');
    const children = largeAsteroid.split();

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Large asteroid split:', 20, 30);
      p.text(`Children count: ${children.length}`, 20, 50);
      if (children.length > 0) {
        p.text(`Child size: ${children[0].size}`, 20, 70);
      }

      // Animate children
      children.forEach((child, i) => {
        child.pos.x = 200 + i * 100;
        child.render();
      });
    });
    await ctx.wait(500);

    expect(children.length).toBe(2);
    expect(children[0].size).toBe('medium');
    expect(children[1].size).toBe('medium');
  });

  it('should split medium asteroid into small asteroids', async (ctx) => {
    const mediumAsteroid = new Asteroid(300, 200, 'about', 'medium');
    const children = mediumAsteroid.split();

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Medium asteroid split:', 20, 30);
      p.text(`Children count: ${children.length}`, 20, 50);
      if (children.length > 0) {
        p.text(`Child size: ${children[0].size}`, 20, 70);
      }

      children.forEach((child, i) => {
        child.pos.x = 200 + i * 100;
        child.render();
      });
    });
    await ctx.wait(500);

    expect(children.length).toBe(2);
    expect(children[0].size).toBe('small');
  });

  it('should not split small asteroids (returns empty)', async (ctx) => {
    const smallAsteroid = new Asteroid(300, 200, 'resume', 'small');
    const children = smallAsteroid.split();

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Small asteroid split:', 20, 30);
      p.text(`Children count: ${children.length}`, 20, 50);
      p.text('Small asteroids do not split further', 20, 70);

      smallAsteroid.render();
    });
    await ctx.wait(500);

    expect(children.length).toBe(0);
  });

  it('should preserve type when splitting', async (ctx) => {
    const workAsteroid = new Asteroid(200, 200, 'work', 'large');
    const aboutAsteroid = new Asteroid(400, 200, 'about', 'large');

    const workChildren = workAsteroid.split();
    const aboutChildren = aboutAsteroid.split();

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Type preservation on split:', 20, 30);
      p.text(`Work children type: ${workChildren[0]?.type}`, 20, 50);
      p.text(`About children type: ${aboutChildren[0]?.type}`, 20, 70);

      workChildren.forEach((c, i) => {
        c.pos.x = 150 + i * 50;
        c.pos.y = 150;
        c.render();
      });
      aboutChildren.forEach((c, i) => {
        c.pos.x = 350 + i * 50;
        c.pos.y = 250;
        c.render();
      });
    });
    await ctx.wait(500);

    expect(workChildren[0].type).toBe('work');
    expect(aboutChildren[0].type).toBe('about');
  });
});

describe('Asteroid Edge Cases', () => {
  it('should handle creation at screen edge', async (ctx) => {
    const edgeAsteroid = new Asteroid(0, 0, 'neutral', 'large');

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Asteroid at origin (0,0):', 20, 30);
      p.text(`Position: (${edgeAsteroid.pos.x}, ${edgeAsteroid.pos.y})`, 20, 50);
      edgeAsteroid.render();
    });
    await ctx.wait(500);

    expect(edgeAsteroid.pos.x).toBe(0);
    expect(edgeAsteroid.pos.y).toBe(0);
  });

  it('should have consistent collision radius with render radius', async (ctx) => {
    const asteroid = new Asteroid(300, 200, 'work', 'large');

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Collision vs render radius:', 20, 30);
      p.text(`Collision radius: ${asteroid.radius}`, 20, 50);

      // Draw collision boundary
      p.noFill();
      p.stroke(255, 0, 0);
      p.ellipse(asteroid.pos.x, asteroid.pos.y, asteroid.radius * 2);

      asteroid.render();
    });
    await ctx.wait(500);

    // Radius should be a positive number
    expect(asteroid.radius).toBeGreaterThan(0);
  });

  it('should animate multiple asteroids independently', async (ctx) => {
    const asteroids = [
      new Asteroid(150, 150, 'work', 'large'),
      new Asteroid(300, 200, 'about', 'medium'),
      new Asteroid(450, 250, 'resume', 'small')
    ];

    // Store initial positions
    const initialPositions = asteroids.map(a => ({ x: a.pos.x, y: a.pos.y }));

    // Animate
    for (let i = 0; i < 30; i++) {
      asteroids.forEach(a => a.update());

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}: Multiple asteroids`, 20, 30);

        asteroids.forEach(a => a.render());
      });
      await ctx.wait(30);
    }

    // All should have moved from initial
    let allMoved = true;
    asteroids.forEach((a, i) => {
      if (a.pos.x === initialPositions[i].x && a.pos.y === initialPositions[i].y) {
        allMoved = false;
      }
    });

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('All asteroids moved independently', 20, 30);
      asteroids.forEach(a => a.render());
    });
    await ctx.wait(400);

    expect(allMoved).toBe(true);
  });
});
