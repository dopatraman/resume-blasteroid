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

  // H to toggle homing mode
  if (key === 'h' || key === 'H') {
    game.toggleHoming();
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
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
