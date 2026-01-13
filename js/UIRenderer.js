/**
 * UIRenderer - Handles all UI/HUD rendering
 * Extracted from Game.js for better separation of concerns
 */
class UIRenderer {
  constructor(game) {
    this.game = game;
  }

  // === Intro Screen ===

  renderIntro() {
    background(PALETTE.background);

    // Draw halo particles (gray/slate color)
    for (let p of this.game.particleSystem.introParticles) {
      let alpha = map(p.life, 0, p.maxLife, 0, 200);
      noStroke();

      // Outer glow
      fill(136, 136, 136, alpha * 0.3);
      ellipse(p.pos.x, p.pos.y, p.size * 3, p.size * 3);

      // Core
      fill(136, 136, 136, alpha);
      ellipse(p.pos.x, p.pos.y, p.size, p.size);
    }

    // Draw ship
    this.game.ship.render();

    // Draw "START" text above ship - Void Neon style
    if (this.game.introTextAlpha > 0) {
      let c = color(PALETTE.ship);
      fill(red(c), green(c), blue(c), this.game.introTextAlpha);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(14);

      // Manual letter-spacing by drawing each character
      let label = 'START';
      let spacing = 4;
      let charWidth = textWidth('S');
      let totalWidth = label.length * charWidth + (label.length - 1) * spacing;
      let startX = this.game.ship.pos.x - totalWidth / 2 + charWidth / 2;

      for (let i = 0; i < label.length; i++) {
        text(label[i], startX + i * (charWidth + spacing), this.game.ship.pos.y - 50);
      }

      // Draw controls below ship - same style as START
      let controlsY = this.game.ship.pos.y + 70;
      let keySize = 16;
      let keyGap = 3;

      // Arrow keys cluster
      let arrowsX = this.game.ship.pos.x - 50;

      // Up arrow
      this.drawIntroKey(arrowsX, controlsY - keySize - keyGap, keySize, '↑');
      // Left, Down, Right
      this.drawIntroKey(arrowsX - keySize - keyGap, controlsY, keySize, '←');
      this.drawIntroKey(arrowsX, controlsY, keySize, '↓');
      this.drawIntroKey(arrowsX + keySize + keyGap, controlsY, keySize, '→');

      // "move" label
      textSize(11);
      text('move', arrowsX, controlsY + keySize + 12);

      // Spacebar
      let spaceX = this.game.ship.pos.x + 50;
      this.drawIntroKey(spaceX, controlsY, keySize, '', 40);

      // "shoot" label
      text('shoot', spaceX, controlsY + keySize + 12);
    }

    // Draw footer (legend + controls)
    this.drawInstructions();
  }

  drawIntroKey(x, y, size, label, width = null) {
    let w = width || size;
    let c = color(PALETTE.ship);
    let r = 3;

    // Key outline (neon lime)
    stroke(red(c), green(c), blue(c), this.game.introTextAlpha);
    strokeWeight(1);
    noFill();
    rect(x - w/2, y - size/2, w, size, r);

    // Key label
    if (label) {
      fill(red(c), green(c), blue(c), this.game.introTextAlpha);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(10);
      text(label, x, y);
    }
  }

  // === Death Effects ===

  renderDeathEffects() {
    let c = color(PALETTE.ship);
    let r = red(c), g = green(c), b = blue(c);

    // Draw pulsing rings
    for (let ring of this.game.particleSystem.deathRings) {
      if (ring.delay > 0) continue;

      noFill();

      // Outer glow
      stroke(r, g, b, ring.alpha * 0.2);
      strokeWeight(8);
      ellipse(ring.pos.x, ring.pos.y, ring.radius * 2, ring.radius * 2);

      // Middle ring
      stroke(r, g, b, ring.alpha * 0.5);
      strokeWeight(4);
      ellipse(ring.pos.x, ring.pos.y, ring.radius * 2, ring.radius * 2);

      // Bright core ring
      stroke(r, g, b, ring.alpha);
      strokeWeight(2);
      ellipse(ring.pos.x, ring.pos.y, ring.radius * 2, ring.radius * 2);

      // White inner edge
      stroke(255, 255, 255, ring.alpha * 0.7);
      strokeWeight(1);
      ellipse(ring.pos.x, ring.pos.y, ring.radius * 2 - 4, ring.radius * 2 - 4);
    }

    // Draw ship debris with glow
    for (let d of this.game.particleSystem.shipDebris) {
      let alpha = map(d.life, 0, d.maxLife, 0, 255);
      noStroke();

      // Outer glow
      fill(r, g, b, alpha * 0.15);
      ellipse(d.pos.x, d.pos.y, d.size * 4, d.size * 4);

      // Middle glow
      fill(r, g, b, alpha * 0.3);
      ellipse(d.pos.x, d.pos.y, d.size * 2.5, d.size * 2.5);

      // Core
      fill(r, g, b, alpha);
      push();
      translate(d.pos.x, d.pos.y);
      rotate(d.rotation);
      // Draw as small triangle fragment
      triangle(0, -d.size/2, -d.size/2, d.size/2, d.size/2, d.size/2);
      pop();

      // White hot center
      fill(255, 255, 255, alpha * 0.6);
      ellipse(d.pos.x, d.pos.y, d.size * 0.3, d.size * 0.3);
    }
  }

  // === HUD ===

  drawScore() {
    fill(PALETTE.textDim);
    noStroke();
    textAlign(RIGHT, TOP);
    textSize(14);
    text(this.game.score, width - 20, 20);

    // Active powerups display
    this.drawActivePowerups();
  }

  drawActivePowerups() {
    let yOffset = 45;
    textAlign(RIGHT, TOP);
    textSize(11);

    if (this.game.activePowerups.chargeshot > 0) {
      let c = color('#00FFFF');
      fill(red(c), green(c), blue(c), 200);
      let tierLabel = this.getTierLabel(this.game.activePowerups.chargeshot);
      text('Charge ' + tierLabel, width - 20, yOffset);
      yOffset += 18;
    }

    if (this.game.activePowerups.homing > 0) {
      let c = color('#FF00FF');
      fill(red(c), green(c), blue(c), 200);
      let tierLabel = this.getTierLabel(this.game.activePowerups.homing);
      text('Homing ' + tierLabel, width - 20, yOffset);
      yOffset += 18;
    }
  }

  getTierLabel(tier) {
    switch (tier) {
      case 1: return 'I';
      case 2: return 'II';
      case 3: return 'III';
      default: return '';
    }
  }

  // === Footer Instructions ===

  drawInstructions() {
    let bottomMargin = 40;
    let rowY = height - bottomMargin;
    let boxSize = 12;
    let legendSpacing = 70;

    // --- Legend (left side) ---
    let legendX = 30;

    textAlign(LEFT, CENTER);
    textSize(11);

    // Work - Orange
    fill(PALETTE.asteroids.work);
    noStroke();
    rect(legendX, rowY - boxSize / 2, boxSize, boxSize);
    fill(PALETTE.textDim);
    text('Work', legendX + boxSize + 6, rowY);

    // About - Blue
    fill(PALETTE.asteroids.about);
    rect(legendX + legendSpacing, rowY - boxSize / 2, boxSize, boxSize);
    fill(PALETTE.textDim);
    text('About', legendX + legendSpacing + boxSize + 6, rowY);

    // Resume - Yellow
    fill(PALETTE.asteroids.resume);
    rect(legendX + legendSpacing * 2, rowY - boxSize / 2, boxSize, boxSize);
    fill(PALETTE.textDim);
    text('Resume', legendX + legendSpacing * 2 + boxSize + 6, rowY);

    // --- Controls (right side) ---
    this.drawControlsHint(rowY);
  }

  drawControlsHint(rowY) {
    let keySize = 18;
    let keyGap = 2;
    let rightMargin = 30;

    // Position from right edge
    let controlsEndX = width - rightMargin;

    // "shoot" text and spacebar
    let spaceWidth = 45;
    textAlign(LEFT, CENTER);
    textSize(11);
    fill(PALETTE.textDim);
    noStroke();

    let shootTextX = controlsEndX - 30;
    text('shoot', shootTextX, rowY);

    let spaceX = shootTextX - spaceWidth - 10;
    this.drawKey(spaceX, rowY - keySize / 2, keySize, '', spaceWidth);

    // "move" text
    let moveTextX = spaceX - 45;
    text('move', moveTextX, rowY);

    // Arrow keys layout (keyboard style)
    //     [↑]
    // [←][↓][→]
    let arrowsRightEdge = moveTextX - 15;
    let arrowsCenterX = arrowsRightEdge - keySize - keyGap - keySize / 2;

    // Up arrow (centered above down)
    this.drawKey(arrowsCenterX - keySize / 2, rowY - keySize - keyGap / 2 - keySize / 2, keySize, '↑');

    // Left, Down, Right arrows
    this.drawKey(arrowsCenterX - keySize / 2 - keyGap - keySize, rowY - keySize / 2, keySize, '←');
    this.drawKey(arrowsCenterX - keySize / 2, rowY - keySize / 2, keySize, '↓');
    this.drawKey(arrowsCenterX + keySize / 2 + keyGap, rowY - keySize / 2, keySize, '→');
  }

  drawKey(x, y, size, label, width = null) {
    let w = width || size;
    let r = 4;  // Corner radius

    // Key background
    stroke(PALETTE.textDim);
    strokeWeight(1);
    fill(PALETTE.background);
    rect(x, y, w, size, r);

    // Key label
    if (label) {
      fill(PALETTE.textDim);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(11);
      text(label, x + w / 2, y + size / 2);
    }
  }
}
