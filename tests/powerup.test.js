/**
 * Powerup Tests
 *
 * Tests for powerup spawning, collision, and edge cases.
 */

describe('Powerup Types', () => {
  it('should create homing powerup with correct color', async (ctx) => {
    const powerup = new Powerup(300, 200, 'homing');

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Homing powerup:', 20, 30);
      p.text(`Type: ${powerup.type}`, 20, 50);
      p.text(`Color: ${powerup.color}`, 20, 70);
      p.text(`Label: ${powerup.getLabel()}`, 20, 90);
      powerup.render();
    });
    await ctx.wait(500);

    expect(powerup.type).toBe('homing');
    expect(powerup.color).toBe('#FF00FF');
    expect(powerup.getLabel()).toBe('H');
  });

  it('should create chargeshot powerup with correct color', async (ctx) => {
    const powerup = new Powerup(300, 200, 'chargeshot');

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Chargeshot powerup:', 20, 30);
      p.text(`Type: ${powerup.type}`, 20, 50);
      p.text(`Color: ${powerup.color}`, 20, 70);
      p.text(`Label: ${powerup.getLabel()}`, 20, 90);
      powerup.render();
    });
    await ctx.wait(500);

    expect(powerup.type).toBe('chargeshot');
    expect(powerup.color).toBe('#00FFFF');
    expect(powerup.getLabel()).toBe('C');
  });

  it('should display both powerup types side by side', async (ctx) => {
    const homingPowerup = new Powerup(200, 200, 'homing');
    const chargeshotPowerup = new Powerup(400, 200, 'chargeshot');

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Powerup types comparison:', 20, 30);
      p.text('Homing (H)', 170, 280);
      p.text('Chargeshot (C)', 360, 280);
      homingPowerup.render();
      chargeshotPowerup.render();
    });
    await ctx.wait(500);

    expect(homingPowerup.type).not.toBe(chargeshotPowerup.type);
  });
});

describe('Powerup Movement', () => {
  it('should move based on velocity', async (ctx) => {
    const powerup = new Powerup(100, 200, 'homing');
    powerup.vel = createVector(3, 0);  // Move right

    const startX = powerup.pos.x;

    for (let i = 0; i < 20; i++) {
      powerup.update();

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}`, 20, 30);
        p.text(`X: ${powerup.pos.x.toFixed(1)}`, 20, 50);
        powerup.render();
      });
      await ctx.wait(30);
    }

    expect(powerup.pos.x).toBeGreaterThan(startX);
  });

  it('should wrap around screen edges', async (ctx) => {
    const powerup = new Powerup(width - 10, 200, 'chargeshot');
    powerup.vel = createVector(5, 0);

    let wrapped = false;

    for (let i = 0; i < 30; i++) {
      const beforeX = powerup.pos.x;
      powerup.update();
      const afterX = powerup.pos.x;

      if (beforeX > width - 50 && afterX < 50) {
        wrapped = true;
      }

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}`, 20, 30);
        p.text(`X: ${powerup.pos.x.toFixed(1)}`, 20, 50);
        p.text(`Wrapped: ${wrapped}`, 20, 70);
        powerup.render();
      });
      await ctx.wait(30);
    }

    expect(wrapped).toBe(true);
  });

  it('should rotate continuously', async (ctx) => {
    const powerup = new Powerup(300, 200, 'homing');
    const startRotation = powerup.rotation;

    for (let i = 0; i < 30; i++) {
      powerup.update();

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}`, 20, 30);
        p.text(`Rotation: ${(powerup.rotation * 180 / PI).toFixed(1)} deg`, 20, 50);
        powerup.render();
      });
      await ctx.wait(30);
    }

    expect(powerup.rotation).toBeGreaterThan(startRotation);
  });
});

describe('Powerup Collision', () => {
  it('should detect collision with bullet at same position', async (ctx) => {
    const powerup = new Powerup(300, 200, 'homing');
    const bullet = new Bullet(300, 200, 0, 0);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Bullet at powerup center:', 20, 30);
      p.text(`hits(): ${powerup.hits(bullet)}`, 20, 50);
      powerup.render();
      bullet.render();
    });
    await ctx.wait(500);

    expect(powerup.hits(bullet)).toBe(true);
  });

  it('should not detect collision with bullet far away', async (ctx) => {
    const powerup = new Powerup(300, 200, 'chargeshot');
    const bullet = new Bullet(100, 100, 0, 0);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Bullet far from powerup:', 20, 30);
      p.text(`hits(): ${powerup.hits(bullet)}`, 20, 50);
      powerup.render();
      bullet.render();
    });
    await ctx.wait(500);

    expect(powerup.hits(bullet)).toBe(false);
  });

  it('should detect collision at edge of radius', async (ctx) => {
    const powerup = new Powerup(300, 200, 'homing');

    // Position bullet just inside collision range
    const collisionDist = powerup.radius + SHAPES.bullet.radius - 1;
    const bullet = new Bullet(300 + collisionDist, 200, 0, 0);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Bullet at edge of powerup:', 20, 30);
      p.text(`Distance: ${collisionDist.toFixed(1)}`, 20, 50);
      p.text(`hits(): ${powerup.hits(bullet)}`, 20, 70);

      // Show collision boundary
      p.noFill();
      p.stroke(255, 0, 0, 100);
      p.ellipse(powerup.pos.x, powerup.pos.y, (powerup.radius + bullet.radius) * 2);

      powerup.render();
      bullet.render();
    });
    await ctx.wait(500);

    expect(powerup.hits(bullet)).toBe(true);
  });
});

describe('Powerup Static Methods', () => {
  it('should spawn powerup from edge', async (ctx) => {
    // Spawn several to show different edges
    const powerups = [];
    for (let i = 0; i < 8; i++) {
      powerups.push(Powerup.spawnFromEdge(i % 2 === 0 ? 'homing' : 'chargeshot'));
    }

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Powerups spawned from edges:', 20, 30);

      powerups.forEach((powerup, i) => {
        p.text(`${i + 1}: (${powerup.pos.x.toFixed(0)}, ${powerup.pos.y.toFixed(0)})`, 20, 50 + i * 15);
        powerup.render();
      });
    });
    await ctx.wait(500);

    // All powerups should exist
    expect(powerups.length).toBe(8);

    // At least some should be at screen edges (allowing for buffer)
    let atEdge = 0;
    for (let p of powerups) {
      if (p.pos.x < 0 || p.pos.x > width || p.pos.y < 0 || p.pos.y > height) {
        atEdge++;
      }
    }

    expect(atEdge).toBeGreaterThan(0);
  });
});

describe('Powerup Edge Cases', () => {
  it('should have jagged vertices', async (ctx) => {
    const powerup = new Powerup(300, 200, 'homing');

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Jagged vertices:', 20, 30);
      p.text(`Vertex count: ${powerup.baseVertices.length}`, 20, 50);
      p.text(`Expected: ${powerup.numVertices}`, 20, 70);
      powerup.render();
    });
    await ctx.wait(500);

    expect(powerup.baseVertices.length).toBe(powerup.numVertices);
  });

  it('should handle unknown type gracefully', async (ctx) => {
    const powerup = new Powerup(300, 200, 'unknown');

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Unknown type powerup:', 20, 30);
      p.text(`Type: ${powerup.type}`, 20, 50);
      p.text(`Color: ${powerup.color}`, 20, 70);
      p.text(`Label: ${powerup.getLabel()}`, 20, 90);
      powerup.render();
    });
    await ctx.wait(500);

    // Should fallback to default values
    expect(powerup.getLabel()).toBe('?');
    expect(powerup.color).toBe('#FF00FF');
  });

  it('should render with pulsing effect over time', async (ctx) => {
    const powerup = new Powerup(300, 200, 'chargeshot');

    for (let i = 0; i < 60; i++) {
      powerup.update();

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}: Pulsing effect`, 20, 30);
        powerup.render();
      });
      await ctx.wait(20);
    }

    // Test passes if no errors during animation
    expect(powerup.pos.x).toBeTruthy();
  });

  it('should maintain radius through updates', async (ctx) => {
    const powerup = new Powerup(300, 200, 'homing');
    const initialRadius = powerup.radius;

    for (let i = 0; i < 30; i++) {
      powerup.update();
    }

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Radius stability:', 20, 30);
      p.text(`Initial: ${initialRadius}`, 20, 50);
      p.text(`After updates: ${powerup.radius}`, 20, 70);
      powerup.render();
    });
    await ctx.wait(500);

    expect(powerup.radius).toBe(initialRadius);
  });
});
