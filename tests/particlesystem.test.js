/**
 * ParticleSystem Tests
 *
 * Tests for particle emission, update lifecycle, and clearing.
 */

describe('ParticleSystem - Emission', () => {
  it('should emit explosion particles with correct count', async (ctx) => {
    const ps = new ParticleSystem();

    ps.emitExplosion(300, 200, '#FF6B35', 10);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text(`Emitted 10 explosion particles`, 20, 30);
      p.text(`Actual count: ${ps.particles.length}`, 20, 50);
      ps.renderParticles();
    });
    await ctx.wait(500);

    expect(ps.particles.length).toBe(10);
  });

  it('should emit explosion particles at specified position', async (ctx) => {
    const ps = new ParticleSystem();
    const targetX = 300;
    const targetY = 200;

    ps.emitExplosion(targetX, targetY, '#4ECDC4', 5);

    // All particles should start at the emission point
    const allAtPosition = ps.particles.every(p =>
      p.pos.x === targetX && p.pos.y === targetY
    );

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text(`Particles emitted at (${targetX}, ${targetY})`, 20, 30);
      p.text(`All at position: ${allAtPosition}`, 20, 50);

      // Show emission point
      p.fill(255, 0, 0);
      p.noStroke();
      p.ellipse(targetX, targetY, 10, 10);

      ps.renderParticles();
    });
    await ctx.wait(500);

    expect(allAtPosition).toBe(true);
  });

  it('should emit intro halo particles', async (ctx) => {
    const ps = new ParticleSystem();

    // Emit several intro particles
    for (let i = 0; i < 20; i++) {
      ps.emitIntroHalo(300, 200);
    }

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text(`Intro particles: ${ps.introParticles.length}`, 20, 30);
      ps.renderIntro();
    });
    await ctx.wait(500);

    expect(ps.introParticles.length).toBe(20);
  });

  it('should emit charge particles with orbital properties', async (ctx) => {
    const ps = new ParticleSystem();
    const shipPos = createVector(300, 200);

    ps.emitChargeParticle(shipPos, 0, 50, 100);

    const particle = ps.chargeParticles[0];

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text(`Charge particle emitted`, 20, 30);
      p.text(`Has orbit radius: ${particle.orbitRadius !== undefined}`, 20, 50);
      p.text(`Has target angle: ${particle.targetAngle !== undefined}`, 20, 70);

      // Show ship position
      p.fill(173, 255, 47);
      p.noStroke();
      p.ellipse(shipPos.x, shipPos.y, 20, 20);

      ps.renderChargeParticles(0.5);
    });
    await ctx.wait(500);

    expect(ps.chargeParticles.length).toBe(1);
    expect(particle.orbitRadius).toBeTruthy();
    expect(particle.targetAngle).not.toBe(undefined);
  });

  it('should emit death rings with delay', async (ctx) => {
    const ps = new ParticleSystem();
    const pos = createVector(300, 200);

    ps.emitDeathRing(pos, 0);
    ps.emitDeathRing(pos, 10);
    ps.emitDeathRing(pos, 20);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text(`Death rings: ${ps.deathRings.length}`, 20, 30);
      p.text(`Ring 1 delay: ${ps.deathRings[0].delay}`, 20, 50);
      p.text(`Ring 2 delay: ${ps.deathRings[1].delay}`, 20, 70);
      p.text(`Ring 3 delay: ${ps.deathRings[2].delay}`, 20, 90);
    });
    await ctx.wait(500);

    expect(ps.deathRings.length).toBe(3);
    expect(ps.deathRings[0].delay).toBe(0);
    expect(ps.deathRings[1].delay).toBe(10);
    expect(ps.deathRings[2].delay).toBe(20);
  });

  it('should emit fire rings with tier-based size', async (ctx) => {
    const ps = new ParticleSystem();
    const pos = createVector(300, 200);
    const dir = createVector(1, 0);

    ps.emitFireRing(pos, dir, 1);
    ps.emitFireRing(pos, dir, 3);

    const tier1Radius = ps.fireRings[0].radius;
    const tier3Radius = ps.fireRings[1].radius;

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text(`Fire rings emitted`, 20, 30);
      p.text(`Tier 1 radius: ${tier1Radius}`, 20, 50);
      p.text(`Tier 3 radius: ${tier3Radius}`, 20, 70);
      ps.renderFireRings();
    });
    await ctx.wait(500);

    expect(tier3Radius).toBeGreaterThan(tier1Radius);
  });
});

describe('ParticleSystem - Update Lifecycle', () => {
  it('should remove particles when life reaches zero', async (ctx) => {
    const ps = new ParticleSystem();

    // Create a particle with very short life
    ps.particles.push({
      pos: createVector(300, 200),
      vel: createVector(0, 0),
      life: 3,
      maxLife: 3,
      size: 5,
      color: '#FFFFFF'
    });

    const initialCount = ps.particles.length;

    // Update until particle expires
    for (let i = 0; i < 5; i++) {
      ps.updateParticles();

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}`, 20, 30);
        p.text(`Particles remaining: ${ps.particles.length}`, 20, 50);
        ps.renderParticles();
      });
      await ctx.wait(100);
    }

    expect(ps.particles.length).toBe(0);
  });

  it('should update particle positions based on velocity', async (ctx) => {
    const ps = new ParticleSystem();

    // Create particle with known velocity
    ps.particles.push({
      pos: createVector(100, 200),
      vel: createVector(5, 0),
      life: 100,
      maxLife: 100,
      size: 8,
      color: '#FF6B35'
    });

    const startX = ps.particles[0].pos.x;

    // Update several frames
    for (let i = 0; i < 10; i++) {
      ps.updateParticles();

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}`, 20, 30);
        p.text(`X position: ${ps.particles[0].pos.x.toFixed(1)}`, 20, 50);

        // Show start position
        p.stroke(100);
        p.noFill();
        p.ellipse(startX, 200, 10, 10);

        ps.renderParticles();
      });
      await ctx.wait(50);
    }

    expect(ps.particles[0].pos.x).toBeGreaterThan(startX);
  });

  it('should apply friction to particle velocity', async (ctx) => {
    const ps = new ParticleSystem();

    ps.particles.push({
      pos: createVector(300, 200),
      vel: createVector(10, 0),
      life: 100,
      maxLife: 100,
      size: 5,
      color: '#4ECDC4'
    });

    const initialSpeed = ps.particles[0].vel.mag();

    // Update many frames
    for (let i = 0; i < 30; i++) {
      ps.updateParticles();
    }

    const finalSpeed = ps.particles[0].vel.mag();

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text(`Friction test`, 20, 30);
      p.text(`Initial speed: ${initialSpeed.toFixed(2)}`, 20, 50);
      p.text(`Final speed: ${finalSpeed.toFixed(2)}`, 20, 70);
      ps.renderParticles();
    });
    await ctx.wait(500);

    expect(finalSpeed).toBeLessThan(initialSpeed);
  });

  it('should remove death rings when radius exceeds maxRadius', async (ctx) => {
    const ps = new ParticleSystem();

    ps.emitDeathRing(createVector(300, 200), 0);
    ps.deathRings[0].maxRadius = 50; // Small max for faster test
    ps.deathRings[0].speed = 10;

    // Update until ring should be removed
    for (let i = 0; i < 10; i++) {
      ps.updateDeathRings();

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}`, 20, 30);
        p.text(`Rings remaining: ${ps.deathRings.length}`, 20, 50);
        if (ps.deathRings.length > 0) {
          p.text(`Current radius: ${ps.deathRings[0].radius.toFixed(1)}`, 20, 70);
        }
      });
      await ctx.wait(50);
    }

    expect(ps.deathRings.length).toBe(0);
  });

  it('should spiral charge particles inward', async (ctx) => {
    const ps = new ParticleSystem();
    const shipPos = createVector(300, 200);

    ps.emitChargeParticle(shipPos, 0, 50, 100);
    const initialRadius = ps.chargeParticles[0].orbitRadius;

    // Update several frames
    for (let i = 0; i < 20; i++) {
      ps.updateChargeParticles();

      ctx.render((p) => {
        p.background(10);
        p.fill(100);
        p.textSize(12);
        p.text(`Frame ${i + 1}`, 20, 30);
        if (ps.chargeParticles.length > 0) {
          p.text(`Orbit radius: ${ps.chargeParticles[0].orbitRadius.toFixed(1)}`, 20, 50);
        }

        // Show ship
        p.fill(173, 255, 47);
        p.noStroke();
        p.ellipse(shipPos.x, shipPos.y, 20, 20);

        ps.renderChargeParticles(0.5);
      });
      await ctx.wait(30);
    }

    // Particle may have been removed if it reached center
    if (ps.chargeParticles.length > 0) {
      expect(ps.chargeParticles[0].orbitRadius).toBeLessThan(initialRadius);
    } else {
      // Particle reached center and was removed - also valid
      expect(ps.chargeParticles.length).toBe(0);
    }
  });
});

describe('ParticleSystem - Clear Methods', () => {
  it('should clear all particles with clear("all")', async (ctx) => {
    const ps = new ParticleSystem();

    // Populate all arrays
    ps.emitExplosion(300, 200, '#FF6B35', 5);
    ps.emitIntroHalo(300, 200);
    ps.emitChargeParticle(createVector(300, 200), 0, 50, 100);
    ps.emitDeathRing(createVector(300, 200), 0);
    ps.emitFireRing(createVector(300, 200), createVector(1, 0), 1);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Before clear:', 20, 30);
      p.text(`Particles: ${ps.particles.length}`, 20, 50);
      p.text(`Intro: ${ps.introParticles.length}`, 20, 70);
      p.text(`Charge: ${ps.chargeParticles.length}`, 20, 90);
      p.text(`Death rings: ${ps.deathRings.length}`, 20, 110);
      p.text(`Fire rings: ${ps.fireRings.length}`, 20, 130);
    });
    await ctx.wait(400);

    ps.clear('all');

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('After clear("all"):', 20, 30);
      p.text(`Particles: ${ps.particles.length}`, 20, 50);
      p.text(`Intro: ${ps.introParticles.length}`, 20, 70);
      p.text(`Charge: ${ps.chargeParticles.length}`, 20, 90);
      p.text(`Death rings: ${ps.deathRings.length}`, 20, 110);
      p.text(`Fire rings: ${ps.fireRings.length}`, 20, 130);
    });
    await ctx.wait(400);

    expect(ps.particles.length).toBe(0);
    expect(ps.introParticles.length).toBe(0);
    expect(ps.chargeParticles.length).toBe(0);
    expect(ps.deathRings.length).toBe(0);
    expect(ps.fireRings.length).toBe(0);
  });

  it('should clear only specified particle type', async (ctx) => {
    const ps = new ParticleSystem();

    // Populate multiple arrays
    ps.emitExplosion(300, 200, '#FF6B35', 5);
    ps.emitIntroHalo(300, 200);

    const initialParticles = ps.particles.length;
    const initialIntro = ps.introParticles.length;

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Before selective clear:', 20, 30);
      p.text(`Particles: ${ps.particles.length}`, 20, 50);
      p.text(`Intro: ${ps.introParticles.length}`, 20, 70);
    });
    await ctx.wait(400);

    // Clear only explosion particles
    ps.clear('particles');

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('After clear("particles"):', 20, 30);
      p.text(`Particles: ${ps.particles.length}`, 20, 50);
      p.text(`Intro: ${ps.introParticles.length}`, 20, 70);
    });
    await ctx.wait(400);

    expect(ps.particles.length).toBe(0);
    expect(ps.introParticles.length).toBe(initialIntro); // Should be unchanged
  });

  it('should clear charge particles with clearCharge()', async (ctx) => {
    const ps = new ParticleSystem();
    const shipPos = createVector(300, 200);

    // Add some charge particles
    for (let i = 0; i < 5; i++) {
      ps.emitChargeParticle(shipPos, 0, 50, 100);
    }

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text(`Charge particles before: ${ps.chargeParticles.length}`, 20, 30);
      ps.renderChargeParticles(0.5);
    });
    await ctx.wait(400);

    ps.clearCharge();

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text(`Charge particles after clearCharge(): ${ps.chargeParticles.length}`, 20, 30);
    });
    await ctx.wait(400);

    expect(ps.chargeParticles.length).toBe(0);
  });

  it('should clear death effects with clearDeath()', async (ctx) => {
    const ps = new ParticleSystem();
    const pos = createVector(300, 200);

    // Add death effects
    ps.emitShipDebris(pos, 5);
    ps.emitDeathRing(pos, 0);
    ps.emitDeathRing(pos, 5);

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text(`Ship debris before: ${ps.shipDebris.length}`, 20, 30);
      p.text(`Death rings before: ${ps.deathRings.length}`, 20, 50);
    });
    await ctx.wait(400);

    ps.clearDeath();

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text(`Ship debris after clearDeath(): ${ps.shipDebris.length}`, 20, 30);
      p.text(`Death rings after clearDeath(): ${ps.deathRings.length}`, 20, 50);
    });
    await ctx.wait(400);

    expect(ps.shipDebris.length).toBe(0);
    expect(ps.deathRings.length).toBe(0);
  });
});

describe('ParticleSystem - Edge Cases', () => {
  it('should handle empty update gracefully', async (ctx) => {
    const ps = new ParticleSystem();

    // Update with no particles should not throw
    let error = null;
    try {
      ps.update();
      ps.render();
    } catch (e) {
      error = e;
    }

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Empty update test', 20, 30);
      p.text(`Error: ${error ? error.message : 'none'}`, 20, 50);
    });
    await ctx.wait(400);

    expect(error).toBe(null);
  });

  it('should handle rapid emit/clear cycles', async (ctx) => {
    const ps = new ParticleSystem();

    // Rapidly emit and clear
    for (let i = 0; i < 10; i++) {
      ps.emitExplosion(300, 200, '#FF6B35', 20);
      ps.clear('particles');
    }

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Rapid emit/clear cycles: 10', 20, 30);
      p.text(`Final particle count: ${ps.particles.length}`, 20, 50);
    });
    await ctx.wait(400);

    expect(ps.particles.length).toBe(0);
  });

  it('should preserve particle color through lifecycle', async (ctx) => {
    const ps = new ParticleSystem();
    const testColor = '#FF00FF';

    ps.emitExplosion(300, 200, testColor, 1);
    const particle = ps.particles[0];

    // Update several times
    for (let i = 0; i < 10; i++) {
      ps.updateParticles();
    }

    ctx.render((p) => {
      p.background(10);
      p.fill(100);
      p.textSize(12);
      p.text('Color preservation test', 20, 30);
      p.text(`Original color: ${testColor}`, 20, 50);
      p.text(`Particle color: ${ps.particles[0]?.color}`, 20, 70);
      ps.renderParticles();
    });
    await ctx.wait(400);

    expect(particle.color).toBe(testColor);
  });
});
