/**
 * PowerupModal - Shows powerup info with tier-specific preview animations
 */

const POWERUP_COLORS = {
  homing: '#FF00FF',    // Magenta
  chargeshot: '#00FFFF', // Cyan
  boost: '#FF6B35'       // Orange
};

const POWERUP_NAMES = {
  homing: 'HOMING',
  chargeshot: 'CHARGE SHOT',
  boost: 'BOOST'
};

const TIER_LABELS = ['', 'I', 'II', 'III'];

// Descriptions for each powerup tier
const POWERUP_DESCRIPTIONS = {
  homing: {
    1: 'HOLD SPACE TO TARGET AN ASTEROID. RELEASE TO FIRE A HOMING MISSILE!',
    2: 'IMPROVED GUIDANCE SYSTEMS. YOUR MISSILES NOW TRACK WITH DEADLY PRECISION!',
    3: 'TARGET 3 ASTEROIDS AT ONCE!'
  },
  chargeshot: {
    1: 'HOLD SPACE TO CHARGE. RELEASE TO DEVASTATE!',
    2: 'NOW YOU GET 3 CHARGED SHOTS. USE THEM WISELY!',
    3: 'UNLEASH A BEAM OF DESTRUCTION.'
  },
  boost: {
    1: 'ENHANCED SPEED AND TURNING. HINT: YOUR THRUST CAN INCINERATE THINGS ;)',
    2: 'DOUBLE TAP THRUST TO RECEIVE A SURGE IN POW-AH!',
    3: 'YOUR SHIP NOW FIRES SUPER HOT PLASMA. NEED I SAY MORE?'
  }
};

class PowerupModal {
  constructor(type, tier) {
    this.type = type;
    this.tier = tier;
    this.color = POWERUP_COLORS[type];
    this.name = POWERUP_NAMES[type] + ' ' + TIER_LABELS[tier];
    this.description = POWERUP_DESCRIPTIONS[type][tier];

    this.timer = 0;
    this.fadeInDuration = 20;
    this.alpha = 0;

    // Preview animation state
    this.previewTimer = 0;
    this.previewShipPos = createVector(0, 0);
    this.previewShipRotation = 0;
    this.previewBullets = [];
    this.previewParticles = [];
    this.previewTargets = [];  // For Homing III multi-target

    // Chargeshot specific
    this.chargeLevel = 0;
    this.isCharging = true;
    this.beam = null;  // For Chargeshot III

    // Boost specific
    this.forcefield = null;  // For Boost II/III
    this.echo = null;  // For Boost III
    this.shipTurning = false;
    this.turnDirection = 0;

    // Modal dimensions
    this.modalWidth = 500;
    this.modalHeight = 300;
  }

  update() {
    this.timer++;

    if (this.timer <= this.fadeInDuration) {
      this.alpha = map(this.timer, 0, this.fadeInDuration, 0, 255);
    } else {
      this.alpha = 255;
    }

    this.previewTimer++;
    this.updatePreview();
  }

  updatePreview() {
    // Use 80% of available width to leave margin
    let previewWidth = 320;
    let previewHeight = 100;
    let centerX = width / 2;
    let centerY = height / 2 + 30;

    switch (this.type) {
      case 'homing':
        this.updateHomingPreview(centerX, centerY, previewWidth);
        break;
      case 'chargeshot':
        this.updateChargeShotPreview(centerX, centerY, previewWidth);
        break;
      case 'boost':
        this.updateBoostPreview(centerX, centerY, previewWidth);
        break;
    }

    // Update bullets
    for (let i = this.previewBullets.length - 1; i >= 0; i--) {
      let b = this.previewBullets[i];
      b.pos.add(b.vel);
      b.life--;

      // Homing behavior
      if (b.isHoming && b.target && b.life > 15) {
        let toTarget = p5.Vector.sub(b.target, b.pos);
        toTarget.normalize();
        toTarget.mult(0.4);
        b.vel.add(toTarget);
        b.vel.limit(5);
      }

      // Check for ricochet trigger (Homing II)
      if (b.isHoming && b.target && !b.isRicochet) {
        let d = dist(b.pos.x, b.pos.y, b.target.x, b.target.y);
        if (d < 15 && this.tier === 2) {
          // Spawn 3 ricochet bullets
          for (let j = 0; j < 3; j++) {
            let angle = (-PI/3) + (j * PI/3) + random(-0.2, 0.2);
            this.previewBullets.push({
              pos: b.pos.copy(),
              vel: p5.Vector.fromAngle(angle).mult(4),
              life: 30,
              maxLife: 30,
              isRicochet: true
            });
          }
          b.life = 0;  // Remove original
        }
      }

      if (b.life <= 0) this.previewBullets.splice(i, 1);
    }

    // Update particles
    for (let i = this.previewParticles.length - 1; i >= 0; i--) {
      let p = this.previewParticles[i];
      p.pos.add(p.vel);
      p.vel.mult(0.95);
      p.life--;
      if (p.life <= 0) this.previewParticles.splice(i, 1);
    }

    // Update beam (Chargeshot III)
    if (this.beam) {
      this.beam.life--;
      if (this.beam.extending) {
        this.beam.length = min(this.beam.length + 30, this.beam.maxLength);
        if (this.beam.length >= this.beam.maxLength) {
          this.beam.extending = false;
        }
      }
      if (this.beam.life <= 0) this.beam = null;
    }

    // Update forcefield (Boost II/III)
    if (this.forcefield) {
      this.forcefield.life--;
      if (this.forcefield.life <= 0) this.forcefield = null;
    }

    // Update echo (Boost III)
    if (this.echo) {
      this.echo.pos.add(this.echo.vel);
      this.echo.life--;
      if (this.echo.life <= 0) this.echo = null;
    }
  }

  updateHomingPreview(cx, cy, pw) {
    let shipX = cx - pw * 0.35;
    let shipY = cy;
    this.previewShipPos.set(shipX, shipY);
    this.previewShipRotation = 0;

    // Set up targets based on tier
    if (this.tier === 3) {
      // Homing III: 3 targets (tighter spacing to fit in preview)
      this.previewTargets = [
        createVector(cx + pw * 0.2, cy - 25),
        createVector(cx + pw * 0.3, cy),
        createVector(cx + pw * 0.2, cy + 25)
      ];
    } else {
      // Homing I/II: single target
      this.previewTargets = [createVector(cx + pw * 0.3, cy)];
    }

    // Fire cycle
    let cycleLength = this.tier === 3 ? 90 : 70;
    if (this.previewTimer % cycleLength === 30) {
      if (this.tier === 3) {
        // Fire 3 bullets at once
        for (let i = 0; i < 3; i++) {
          this.previewBullets.push({
            pos: createVector(shipX + 15, shipY),
            vel: createVector(3, (i - 1) * 0.5),
            life: 70,
            maxLife: 70,
            isHoming: true,
            target: this.previewTargets[i].copy(),
            tier: this.tier
          });
        }
      } else {
        // Fire single bullet
        this.previewBullets.push({
          pos: createVector(shipX + 15, shipY),
          vel: createVector(3, 0),
          life: 60,
          maxLife: 60,
          isHoming: true,
          target: this.previewTargets[0].copy(),
          tier: this.tier
        });
      }
    }

    // Trail particles for homing bullets
    for (let b of this.previewBullets) {
      if (b.isHoming && !b.isRicochet && this.previewTimer % 2 === 0) {
        let trailColor = this.tier === 1 ? '#FFD700' : '#00FFFF';  // Gold for I, Cyan for II/III
        this.previewParticles.push({
          pos: b.pos.copy(),
          vel: createVector(random(-0.5, 0.5), random(-0.5, 0.5)),
          life: 15,
          maxLife: 15,
          color: trailColor,
          isTrail: true
        });
      }
    }
  }

  updateChargeShotPreview(cx, cy, pw) {
    let shipX = cx - pw * 0.3;
    let shipY = cy;
    this.previewShipPos.set(shipX, shipY);
    this.previewShipRotation = 0;

    let cycleLength = this.tier === 3 ? 140 : 120;
    let cycleFrame = this.previewTimer % cycleLength;
    let chargeTime = this.tier === 3 ? 70 : 60;

    if (cycleFrame < chargeTime) {
      // Charging
      this.chargeLevel = cycleFrame;
      this.isCharging = true;

      // Charge particles - more intense for higher tiers
      let spawnRate = this.tier === 3 ? 2 : 3;
      if (cycleFrame % spawnRate === 0) {
        let angle = random(TWO_PI);
        let dist = random(30, 50);
        let pColor = this.tier === 3 ? random(['#00FFFF', '#FF00FF', '#FFFFFF']) : '#00FFFF';
        this.previewParticles.push({
          pos: createVector(shipX + cos(angle) * dist, shipY + sin(angle) * dist),
          vel: p5.Vector.fromAngle(angle + PI).mult(2.5),
          life: 15,
          maxLife: 15,
          color: pColor
        });
      }
    } else if (cycleFrame === chargeTime) {
      // Fire!
      this.isCharging = false;
      this.chargeLevel = 0;

      if (this.tier === 3) {
        // Fire beam
        this.beam = {
          pos: createVector(shipX + 15, shipY),
          angle: 0,
          length: 0,
          maxLength: 200,
          width: 25,
          life: 45,
          extending: true
        };
      } else if (this.tier === 2) {
        // Fire 3 sequential bullets
        for (let i = 0; i < 3; i++) {
          this.previewBullets.push({
            pos: createVector(shipX + 15 + i * 20, shipY),
            vel: createVector(5, 0),
            life: 50 - i * 5,
            maxLife: 50,
            isCharged: true,
            size: 10
          });
        }
      } else {
        // Fire single bullet
        this.previewBullets.push({
          pos: createVector(shipX + 15, shipY),
          vel: createVector(5, 0),
          life: 50,
          maxLife: 50,
          isCharged: true,
          size: 12
        });
      }
    }
  }

  updateBoostPreview(cx, cy, pw) {
    let cycleLength = 150;
    let cycleFrame = this.previewTimer % cycleLength;

    if (this.tier === 1) {
      // Boost I: Ship turning with swerve particles
      let shipX = cx;
      let shipY = cy;

      // Oscillate rotation to show turning
      this.previewShipRotation = sin(cycleFrame * 0.08) * 0.6;
      this.shipTurning = abs(cos(cycleFrame * 0.08)) > 0.5;
      this.turnDirection = cos(cycleFrame * 0.08) > 0 ? 1 : -1;

      this.previewShipPos.set(shipX, shipY);

      // Enhanced thrust plume
      if (this.previewTimer % 2 === 0) {
        let backAngle = this.previewShipRotation + PI;
        let backX = shipX + cos(backAngle) * 15;
        let backY = shipY + sin(backAngle) * 15;

        // Center plume
        this.previewParticles.push({
          pos: createVector(backX, backY),
          vel: p5.Vector.fromAngle(backAngle).mult(random(2, 4)),
          life: 18,
          maxLife: 18,
          color: random(['#FF6B35', '#FFE66D']),
          isPlume: true
        });

        // Swerve particles when turning (reduced velocity to stay in bounds)
        if (this.shipTurning) {
          let swerveAngle = backAngle + (this.turnDirection * -0.5);
          this.previewParticles.push({
            pos: createVector(backX, backY),
            vel: p5.Vector.fromAngle(swerveAngle).mult(random(2.5, 4)),
            life: 18,
            maxLife: 18,
            color: random(['#FF6B35', '#FFE66D']),
            isSwerve: true
          });
        }
      }
    } else {
      // Boost II/III: Double-tap surge with forcefield
      let shipX = cx - pw * 0.2;
      let shipY = cy;
      this.previewShipPos.set(shipX, shipY);
      this.previewShipRotation = 0;

      // Surge cycle: wait, surge, show forcefield
      if (cycleFrame === 30) {
        // Trigger surge - spawn burst particles
        for (let i = 0; i < 15; i++) {
          let angle = PI + random(-0.5, 0.5);
          this.previewParticles.push({
            pos: createVector(shipX - 15, shipY),
            vel: p5.Vector.fromAngle(angle).mult(random(4, 8)),
            life: 25,
            maxLife: 25,
            color: random(['#FF6B35', '#FFE66D', '#FFFFFF']),
            isPlume: true
          });
        }

        // Activate forcefield
        let arcAngle = this.tier === 3 ? PI : PI * 0.83;  // 180° vs 150°
        let arcRadius = this.tier === 3 ? 35 : 25;
        this.forcefield = {
          arcAngle: arcAngle,
          radius: arcRadius,
          life: 70
        };

        // Boost III: Fire echo projectile
        if (this.tier === 3) {
          this.echo = {
            pos: createVector(shipX + 20, shipY),
            vel: createVector(4, 0),
            radius: 35,
            arcAngle: PI,
            life: 40
          };
        }
      }

      // Plasma jets when forcefield active (Boost III)
      if (this.tier === 3 && this.forcefield && this.previewTimer % 4 === 0) {
        // Side plasma jets
        this.previewParticles.push({
          pos: createVector(shipX - 10, shipY - 8),
          vel: createVector(random(-2, -1), random(-2, -1)),
          life: 18,
          maxLife: 18,
          color: '#FFFFFF',
          isPlasma: true
        });
        this.previewParticles.push({
          pos: createVector(shipX - 10, shipY + 8),
          vel: createVector(random(-2, -1), random(1, 2)),
          life: 18,
          maxLife: 18,
          color: '#00FFFF',
          isPlasma: true
        });
      }

      // Regular thrust when no forcefield
      if (!this.forcefield && this.previewTimer % 3 === 0) {
        this.previewParticles.push({
          pos: createVector(shipX - 15, shipY),
          vel: createVector(random(-3, -1), random(-0.5, 0.5)),
          life: 18,
          maxLife: 18,
          color: random(['#FF6B35', '#FFE66D']),
          isPlume: true
        });
      }
    }
  }

  render() {
    // Dim overlay
    noStroke();
    fill(0, 0, 0, this.alpha * 0.85);
    rect(0, 0, width, height);

    let cx = width / 2;
    let cy = height / 2;
    let mw = this.modalWidth;
    let mh = this.modalHeight;

    // Modal box
    let c = color(this.color);
    let r = red(c), g = green(c), b = blue(c);

    // Modal background
    fill(10, 10, 10, this.alpha);
    stroke(r, g, b, this.alpha);
    strokeWeight(2);
    rect(cx - mw / 2, cy - mh / 2, mw, mh, 4);

    // Powerup name
    fill(r, g, b, this.alpha);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(24);
    this.drawSpacedText(this.name, cx, cy - mh / 2 + 40, 6);

    // Description - dynamically size to fit
    fill(255, 255, 255, this.alpha * 0.9);
    let descFit = this.fitTextToWidth(this.description, mw - 40, 12, 2, 9, 0);
    textSize(descFit.size);
    this.drawSpacedText(this.description, cx, cy - mh / 2 + 75, descFit.spacing);

    // Preview area
    let previewY = cy + 20;
    let previewH = 100;

    // Preview border (wider to match modal)
    stroke(r, g, b, this.alpha * 0.3);
    strokeWeight(1);
    noFill();
    rect(cx - 200, previewY - previewH / 2, 400, previewH, 2);

    // Render preview content
    this.renderPreview(previewY);

    // Dismiss hint
    fill(100, 100, 100, this.alpha);
    textSize(11);
    textAlign(CENTER, CENTER);
    text('CLICK OR PRESS ANY KEY', cx, cy + mh / 2 - 25);
  }

  renderPreview(centerY) {
    // Draw particles first
    for (let p of this.previewParticles) {
      let alpha = map(p.life, 0, p.maxLife, 0, 255) * (this.alpha / 255);
      let pc = color(p.color);

      if (p.isPlume || p.isSwerve) {
        let size = map(p.life, 0, p.maxLife, 2, p.isSwerve ? 6 : 8);
        noStroke();
        fill(red(pc), green(pc), blue(pc), alpha * 0.3);
        ellipse(p.pos.x, p.pos.y, size * 2.5, size * 2.5);
        fill(red(pc), green(pc), blue(pc), alpha);
        ellipse(p.pos.x, p.pos.y, size, size);
      } else if (p.isPlasma) {
        let size = map(p.life, 0, p.maxLife, 1, 5);
        noStroke();
        fill(red(pc), green(pc), blue(pc), alpha * 0.5);
        ellipse(p.pos.x, p.pos.y, size * 2, size * 2);
        fill(255, 255, 255, alpha);
        ellipse(p.pos.x, p.pos.y, size * 0.5, size * 0.5);
      } else if (p.isTrail) {
        let size = map(p.life, 0, p.maxLife, 1, 4);
        noStroke();
        fill(red(pc), green(pc), blue(pc), alpha * 0.6);
        ellipse(p.pos.x, p.pos.y, size * 2, size * 2);
        fill(red(pc), green(pc), blue(pc), alpha);
        ellipse(p.pos.x, p.pos.y, size, size);
      } else {
        let size = map(p.life, 0, p.maxLife, 1, 4);
        noStroke();
        fill(red(pc), green(pc), blue(pc), alpha);
        ellipse(p.pos.x, p.pos.y, size, size);
      }
    }

    // Draw beam (Chargeshot III)
    if (this.beam) {
      let beamAlpha = map(this.beam.life, 0, 45, 0, this.alpha);
      push();
      translate(this.beam.pos.x, this.beam.pos.y);
      rotate(this.beam.angle);

      // Outer magenta glow
      noFill();
      stroke(255, 0, 255, beamAlpha * 0.3);
      strokeWeight(this.beam.width * 1.5);
      line(0, 0, this.beam.length, 0);

      // Middle cyan
      stroke(0, 255, 255, beamAlpha * 0.5);
      strokeWeight(this.beam.width);
      line(0, 0, this.beam.length, 0);

      // Core white
      stroke(255, 255, 255, beamAlpha);
      strokeWeight(this.beam.width * 0.3);
      line(0, 0, this.beam.length, 0);

      // Helix effect
      stroke(0, 255, 255, beamAlpha * 0.7);
      strokeWeight(2);
      noFill();
      beginShape();
      for (let i = 0; i < this.beam.length; i += 5) {
        let helixY = sin(i * 0.15 + this.previewTimer * 0.2) * (this.beam.width * 0.4);
        vertex(i, helixY);
      }
      endShape();

      stroke(255, 0, 255, beamAlpha * 0.7);
      beginShape();
      for (let i = 0; i < this.beam.length; i += 5) {
        let helixY = sin(i * 0.15 + this.previewTimer * 0.2 + PI) * (this.beam.width * 0.4);
        vertex(i, helixY);
      }
      endShape();

      pop();
    }

    // Draw echo (Boost III)
    if (this.echo) {
      let echoAlpha = map(this.echo.life, 0, 40, 0, this.alpha);
      push();
      translate(this.echo.pos.x, this.echo.pos.y);

      noFill();
      // Outer glow
      stroke(0, 255, 255, echoAlpha * 0.3);
      strokeWeight(8);
      arc(0, 0, this.echo.radius * 2, this.echo.radius * 2, -this.echo.arcAngle / 2, this.echo.arcAngle / 2);

      // Core
      stroke(0, 255, 255, echoAlpha);
      strokeWeight(3);
      arc(0, 0, this.echo.radius * 2, this.echo.radius * 2, -this.echo.arcAngle / 2, this.echo.arcAngle / 2);

      pop();
    }

    // Draw forcefield (Boost II/III)
    if (this.forcefield) {
      let ffAlpha = map(this.forcefield.life, 0, 70, 0, this.alpha);
      push();
      translate(this.previewShipPos.x + 12, this.previewShipPos.y);

      noFill();
      // Outer glow
      stroke(0, 255, 255, ffAlpha * 0.2);
      strokeWeight(10);
      arc(0, 0, this.forcefield.radius * 2, this.forcefield.radius * 2,
          -this.forcefield.arcAngle / 2, this.forcefield.arcAngle / 2);

      // Middle
      stroke(0, 255, 255, ffAlpha * 0.5);
      strokeWeight(4);
      arc(0, 0, this.forcefield.radius * 2, this.forcefield.radius * 2,
          -this.forcefield.arcAngle / 2, this.forcefield.arcAngle / 2);

      // Core
      stroke(0, 255, 255, ffAlpha);
      strokeWeight(2);
      arc(0, 0, this.forcefield.radius * 2, this.forcefield.radius * 2,
          -this.forcefield.arcAngle / 2, this.forcefield.arcAngle / 2);

      pop();
    }

    // Draw bullets
    for (let b of this.previewBullets) {
      let alpha = this.alpha;

      if (b.isCharged) {
        noStroke();
        fill(0, 255, 255, alpha * 0.2);
        ellipse(b.pos.x, b.pos.y, b.size * 3, b.size * 3);
        fill(0, 255, 255, alpha * 0.5);
        ellipse(b.pos.x, b.pos.y, b.size * 1.5, b.size * 1.5);
        fill(255, 255, 255, alpha);
        ellipse(b.pos.x, b.pos.y, b.size * 0.6, b.size * 0.6);
      } else if (b.isHoming) {
        let bulletColor = b.tier === 1 ? color(255, 215, 0) : color(0, 255, 255);
        noStroke();
        fill(red(bulletColor), green(bulletColor), blue(bulletColor), alpha * 0.3);
        ellipse(b.pos.x, b.pos.y, 14, 14);
        fill(255, 255, 255, alpha);
        ellipse(b.pos.x, b.pos.y, 5, 5);
      } else if (b.isRicochet) {
        noStroke();
        fill(255, 0, 255, alpha * 0.4);
        ellipse(b.pos.x, b.pos.y, 10, 10);
        fill(255, 255, 255, alpha);
        ellipse(b.pos.x, b.pos.y, 3, 3);
      } else {
        noStroke();
        fill(255, 255, 255, alpha);
        ellipse(b.pos.x, b.pos.y, 3, 3);
      }
    }

    // Draw mini ship
    push();
    translate(this.previewShipPos.x, this.previewShipPos.y);
    rotate(this.previewShipRotation);

    let shipSize = 12;

    // Boost III: Green glow during forcefield
    if (this.type === 'boost' && this.tier === 3 && this.forcefield) {
      noFill();
      stroke(0, 255, 65, this.alpha * 0.3);
      strokeWeight(8);
      triangle(shipSize, 0, -shipSize * 0.5, -shipSize * 0.65, -shipSize * 0.5, shipSize * 0.65);
    }

    // Charge glow effect
    if (this.type === 'chargeshot' && this.isCharging && this.chargeLevel > 0) {
      let maxCharge = this.tier === 3 ? 70 : 60;
      let glowAlpha = map(this.chargeLevel, 0, maxCharge, 0, 150) * (this.alpha / 255);
      let glowColor = this.tier === 3 ? color(255, 0, 255) : color(0, 255, 255);
      noFill();
      stroke(red(glowColor), green(glowColor), blue(glowColor), glowAlpha);
      strokeWeight(3);
      ellipse(0, 0, shipSize * 3 + this.chargeLevel * 0.3, shipSize * 3 + this.chargeLevel * 0.3);
    }

    // Ship body
    fill(10, 10, 10);
    stroke(173, 255, 47, this.alpha);
    strokeWeight(1);
    triangle(shipSize, 0, -shipSize * 0.5, -shipSize * 0.65, -shipSize * 0.5, shipSize * 0.65);

    // Thrust flame
    if (this.type === 'boost' || (this.type !== 'chargeshot')) {
      if (this.type === 'boost') {
        fill(255, 107, 53, this.alpha);
        noStroke();
        beginShape();
        vertex(-shipSize * 0.5, -shipSize * 0.2);
        vertex(-shipSize * 1.5 - random(3), 0);
        vertex(-shipSize * 0.5, shipSize * 0.2);
        endShape(CLOSE);
      }
    }

    pop();

    // Draw targets for homing preview
    if (this.type === 'homing') {
      for (let i = 0; i < this.previewTargets.length; i++) {
        let t = this.previewTargets[i];
        let targetColor = this.tier === 3 ? color(255, 0, 0) : color(255, 0, 255);
        let targetAlpha = this.alpha * 0.7;

        noFill();
        stroke(red(targetColor), green(targetColor), blue(targetColor), targetAlpha);
        strokeWeight(2);

        // Target circle
        ellipse(t.x, t.y, 25, 25);

        // Crosshairs
        line(t.x - 17, t.y, t.x - 8, t.y);
        line(t.x + 8, t.y, t.x + 17, t.y);
        line(t.x, t.y - 17, t.x, t.y - 8);
        line(t.x, t.y + 8, t.x, t.y + 17);
      }
    }
  }

  drawSpacedText(label, centerX, y, spacing) {
    let totalWidth = 0;
    for (let i = 0; i < label.length; i++) {
      totalWidth += textWidth(label[i]);
      if (i < label.length - 1) totalWidth += spacing;
    }

    let x = centerX - totalWidth / 2;
    for (let i = 0; i < label.length; i++) {
      let charWidth = textWidth(label[i]);
      text(label[i], x + charWidth / 2, y);
      x += charWidth + spacing;
    }
  }

  // Calculate text width with letter spacing
  getSpacedTextWidth(label, spacing) {
    let totalWidth = 0;
    for (let i = 0; i < label.length; i++) {
      totalWidth += textWidth(label[i]);
      if (i < label.length - 1) totalWidth += spacing;
    }
    return totalWidth;
  }

  // Find font size and spacing that fits text within maxWidth
  fitTextToWidth(label, maxWidth, startSize, startSpacing, minSize, minSpacing) {
    let size = startSize;
    let spacing = startSpacing;

    while (size >= minSize) {
      textSize(size);
      let w = this.getSpacedTextWidth(label, spacing);
      if (w <= maxWidth) {
        return { size, spacing };
      }
      // Try reducing spacing first
      if (spacing > minSpacing) {
        spacing = max(minSpacing, spacing - 0.5);
      } else {
        // Then reduce font size
        size--;
        spacing = startSpacing;  // Reset spacing for new size
      }
    }
    // Return minimum values if nothing fits
    textSize(minSize);
    return { size: minSize, spacing: minSpacing };
  }
}
