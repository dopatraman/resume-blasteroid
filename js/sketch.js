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
    game.fire();
    return false;  // Prevent page scroll
  }

  // ESC to return to game from section
  if (keyCode === ESCAPE && game.state === GameState.SECTION) {
    game.returnToGame();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
