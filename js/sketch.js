let game;

function setup() {
  createCanvas(windowWidth, windowHeight);
  game = new Game();
  game.init();
}

function draw() {
  game.update();
  game.render();
}

function keyPressed() {
  if (key === ' ' || keyCode === 32) {
    game.startCharging();
    return false;  // Prevent page scroll
  }

  // UP_ARROW for Boost II double-tap
  if (keyCode === UP_ARROW) {
    game.thrustPressed();
  }

  // ESC to return to game from section
  if (keyCode === ESCAPE && game.state === GameState.SECTION) {
    game.returnToGame();
  }
}

function keyReleased() {
  if (key === ' ' || keyCode === 32) {
    game.releaseCharge();
  }

  // UP_ARROW release for Boost II forcefield
  if (keyCode === UP_ARROW) {
    game.thrustReleased();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
