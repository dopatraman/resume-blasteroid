const SHAPES = {
  ship: {
    size: 20,
    vertices: 3
  },
  asteroids: {
    // Each section type gets a distinct shape
    work: { vertices: 6, jaggedness: 0.3 },      // Hexagon-ish
    about: { vertices: 8, jaggedness: 0.25 },    // Octagon-ish
    resume: { vertices: 5, jaggedness: 0.35 },   // Pentagon-ish
    neutral: { vertices: 7, jaggedness: 0.3 }    // Heptagon-ish
  },
  asteroidSizes: {
    small: 35,
    medium: 50,
    large: 70
  },
  bullet: {
    radius: 3,
    speed: 10,
    lifespan: 60  // frames
  }
};
