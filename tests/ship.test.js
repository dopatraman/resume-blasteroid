/**
 * Ship Tests
 *
 * Tests for ship movement, rotation, and bullet firing.
 */

describe('Ship Movement', () => {
  it('should initialize at specified position', async (ctx) => {
    const ship = new Ship(300, 200);

    // Visualize
    ctx.render((p) => {
      p.background(10);
      p.fill(255);
      p.textSize(12);
      p.text(`Ship at (${ship.pos.x}, ${ship.pos.y})`, 20, 30);
      ship.render();
    });
    await ctx.wait(500);

    expect(ship.pos.x).toBe(300);
    expect(ship.pos.y).toBe(200);
  });

  it('should move forward when thrust is applied', async (ctx) => {
    const ship = new Ship(300, 200);
    ship.rotation = 0; // Face right

    const startX = ship.pos.x;
    const startY = ship.pos.y;

    // Visualize starting position
    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Before thrust', 20, 30);
      p.stroke(100);
      p.noFill();
      p.ellipse(startX, startY, 20, 20); // Mark start
      ship.render();
    });
    await ctx.wait(300);

    // Apply thrust for several frames
    for (let i = 0; i < 30; i++) {
      ship.thrust();
      ship.update();

      // Visualize movement
      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}: thrust applied`, 20, 30);
        p.text(`Position: (${ship.pos.x.toFixed(1)}, ${ship.pos.y.toFixed(1)})`, 20, 50);

        // Show start position
        p.stroke(100);
        p.noFill();
        p.ellipse(startX, startY, 20, 20);

        // Draw trail
        p.stroke(80);
        p.line(startX, startY, ship.pos.x, ship.pos.y);

        ship.render();
      });
      await ctx.wait(30);
    }

    // Ship should have moved right (rotation = 0)
    expect(ship.pos.x).toBeGreaterThan(startX);
  });

  it('should rotate left when turn(-1) is called', async (ctx) => {
    const ship = new Ship(300, 200);
    const startRotation = ship.rotation;

    // Visualize rotation
    for (let i = 0; i < 20; i++) {
      ship.turn(-1);

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Rotating left: ${(ship.rotation * 180 / Math.PI).toFixed(1)} degrees`, 20, 30);
        ship.render();
      });
      await ctx.wait(50);
    }

    expect(ship.rotation).toBeLessThan(startRotation);
  });

  it('should rotate right when turn(1) is called', async (ctx) => {
    const ship = new Ship(300, 200);
    const startRotation = ship.rotation;

    // Visualize rotation
    for (let i = 0; i < 20; i++) {
      ship.turn(1);

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Rotating right: ${(ship.rotation * 180 / Math.PI).toFixed(1)} degrees`, 20, 30);
        ship.render();
      });
      await ctx.wait(50);
    }

    expect(ship.rotation).toBeGreaterThan(startRotation);
  });

  it('should slow down due to friction', async (ctx) => {
    const ship = new Ship(300, 200);
    ship.rotation = 0;

    // Give initial velocity
    ship.thrust();
    ship.thrust();
    ship.thrust();

    const initialSpeed = ship.vel.mag();

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text(`Initial speed: ${initialSpeed.toFixed(2)}`, 20, 30);
      ship.render();
    });
    await ctx.wait(300);

    // Let friction slow it down (no thrust)
    for (let i = 0; i < 60; i++) {
      ship.update();

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}: no thrust, friction slowing`, 20, 30);
        p.text(`Speed: ${ship.vel.mag().toFixed(2)}`, 20, 50);
        ship.render();
      });
      await ctx.wait(20);
    }

    expect(ship.vel.mag()).toBeLessThan(initialSpeed);
  });
});

describe('Ship Firing', () => {
  it('should create a bullet when fire() is called', async (ctx) => {
    const ship = new Ship(300, 200);
    const bullet = ship.fire();

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Bullet created!', 20, 30);
      p.text(`Bullet pos: (${bullet.pos.x.toFixed(1)}, ${bullet.pos.y.toFixed(1)})`, 20, 50);
      ship.render();
      bullet.render();
    });
    await ctx.wait(500);

    expect(bullet).toBeTruthy();
    expect(bullet.pos).toBeTruthy();
  });

  it('should fire bullet from nose position', async (ctx) => {
    const ship = new Ship(300, 200);
    ship.rotation = 0; // Face right

    const nosePos = ship.getNosePosition();
    const bullet = ship.fire();

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text(`Nose position: (${nosePos.x.toFixed(1)}, ${nosePos.y.toFixed(1)})`, 20, 30);
      p.text(`Bullet position: (${bullet.pos.x.toFixed(1)}, ${bullet.pos.y.toFixed(1)})`, 20, 50);

      // Mark nose position
      p.fill(255, 0, 0);
      p.noStroke();
      p.ellipse(nosePos.x, nosePos.y, 8, 8);

      ship.render();
      bullet.render();
    });
    await ctx.wait(500);

    // Bullet should spawn at nose (within small tolerance)
    expect(Math.abs(bullet.pos.x - nosePos.x)).toBeLessThan(1);
    expect(Math.abs(bullet.pos.y - nosePos.y)).toBeLessThan(1);
  });

  it('should fire bullet in direction ship is facing', async (ctx) => {
    const ship = new Ship(300, 200);
    ship.rotation = Math.PI / 4; // Face 45 degrees (down-right)

    const bullet = ship.fire();
    const startPos = bullet.pos.copy();

    // Animate bullet travel
    for (let i = 0; i < 30; i++) {
      bullet.update();

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Ship facing: ${(ship.rotation * 180 / Math.PI).toFixed(1)} degrees`, 20, 30);
        p.text(`Bullet velocity: (${bullet.vel.x.toFixed(1)}, ${bullet.vel.y.toFixed(1)})`, 20, 50);

        // Draw trajectory line
        p.stroke(50);
        p.line(startPos.x, startPos.y, bullet.pos.x, bullet.pos.y);

        ship.render();
        bullet.render();
      });
      await ctx.wait(30);
    }

    // Bullet should move in direction of rotation
    // At 45 degrees, both x and y should increase
    expect(bullet.vel.x).toBeGreaterThan(0);
    expect(bullet.vel.y).toBeGreaterThan(0);
  });

  it('should have bullet velocity greater than zero', async (ctx) => {
    const ship = new Ship(300, 200);
    const bullet = ship.fire();

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text(`Bullet speed: ${bullet.vel.mag().toFixed(2)}`, 20, 30);
      ship.render();
      bullet.render();
    });
    await ctx.wait(500);

    expect(bullet.vel.mag()).toBeGreaterThan(0);
  });

  it('should create muzzle flash particles when firing', async (ctx) => {
    const ship = new Ship(300, 200);
    const initialParticles = ship.muzzleParticles.length;

    ship.fire();

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text(`Muzzle particles: ${ship.muzzleParticles.length}`, 20, 30);
      ship.render();
    });
    await ctx.wait(500);

    expect(ship.muzzleParticles.length).toBeGreaterThan(initialParticles);
  });
});
