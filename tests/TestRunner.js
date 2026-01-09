/**
 * TestRunner - A simple visual test framework for p5.js games
 *
 * Usage:
 *   describe('Suite Name', () => {
 *     it('test description', async (ctx) => {
 *       // ctx.p5 - p5 instance
 *       // ctx.render(fn) - render something on canvas
 *       // ctx.wait(ms) - wait for visualization
 *       expect(value).toBe(expected);
 *     });
 *   });
 */

const TestRunner = {
  suites: [],
  currentSuite: null,
  results: {
    passed: 0,
    failed: 0,
    total: 0
  },

  // Register a test suite
  addSuite(name, fn) {
    const suite = {
      name,
      tests: [],
      fn
    };
    this.suites.push(suite);
  },

  // Register a test within current suite
  addTest(name, fn) {
    if (this.currentSuite) {
      this.currentSuite.tests.push({ name, fn, status: 'pending', error: null });
    }
  },

  // Run all tests
  async run() {
    this.results = { passed: 0, failed: 0, total: 0 };
    this.updateSummary();
    document.getElementById('summary').style.display = 'block';

    // Collect all tests from suites
    for (const suite of this.suites) {
      this.currentSuite = suite;
      suite.fn();
    }
    this.currentSuite = null;

    // Render initial state
    this.renderResults();

    // Count total tests
    for (const suite of this.suites) {
      this.results.total += suite.tests.length;
    }
    this.updateSummary();

    // Run each suite
    for (const suite of this.suites) {
      for (const test of suite.tests) {
        await this.runTest(suite, test);
      }
    }

    // Show final status
    this.showFinalStatus();
  },

  // Run a single test
  async runTest(suite, test) {
    test.status = 'running';
    this.renderResults();

    const ctx = this.createTestContext();

    try {
      await test.fn(ctx);
      test.status = 'passed';
      this.results.passed++;
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      this.results.failed++;
    }

    this.renderResults();
    this.updateSummary();

    // Small delay between tests for visualization
    await this.delay(100);
  },

  // Create context object passed to each test
  createTestContext() {
    const p = window.p5Instance;

    return {
      p5: p,

      // Render something on canvas
      render(fn) {
        p.push();
        p.background(10);
        fn(p);
        p.pop();
      },

      // Wait for ms milliseconds (for visualization)
      wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      },

      // Clear canvas
      clear() {
        p.background(10);
      }
    };
  },

  // Render test results to DOM
  renderResults() {
    const container = document.getElementById('test-results');
    let html = '';

    for (const suite of this.suites) {
      html += `<div class="suite">`;
      html += `<div class="suite-name">${suite.name}</div>`;

      for (const test of suite.tests) {
        html += `<div class="test ${test.status}">`;
        html += `<span class="test-icon"></span>`;
        html += `<span class="test-name">${test.name}</span>`;
        html += `</div>`;

        if (test.error) {
          html += `<div class="error-message">${test.error}</div>`;
        }
      }

      html += `</div>`;
    }

    container.innerHTML = html;
  },

  // Update summary stats
  updateSummary() {
    document.getElementById('passed-count').textContent = this.results.passed;
    document.getElementById('failed-count').textContent = this.results.failed;
    document.getElementById('total-count').textContent = this.results.total;

    const percent = this.results.total > 0
      ? (this.results.passed / this.results.total) * 100
      : 0;

    const progressFill = document.getElementById('progress-fill');
    progressFill.style.width = `${(this.results.passed + this.results.failed) / this.results.total * 100}%`;

    if (this.results.failed > 0) {
      const passPercent = (this.results.passed / (this.results.passed + this.results.failed)) * 100;
      progressFill.classList.add('has-failures');
      progressFill.style.setProperty('--pass-percent', `${passPercent}%`);
    }
  },

  // Show final status banner
  showFinalStatus() {
    const banner = document.getElementById('status-banner');
    banner.classList.remove('running');

    if (this.results.failed === 0) {
      banner.classList.add('passed');
      banner.textContent = `All ${this.results.total} tests passed!`;
    } else {
      banner.classList.add('failed');
      banner.textContent = `${this.results.failed} of ${this.results.total} tests failed`;
    }
  },

  // Helper delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Global test registration functions
function describe(name, fn) {
  TestRunner.addSuite(name, fn);
}

function it(name, fn) {
  TestRunner.addTest(name, fn);
}

// Assertion library
function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },

    not: {
      toBe(expected) {
        if (actual === expected) {
          throw new Error(`Expected value to not be ${JSON.stringify(expected)}`);
        }
      }
    },

    toBeGreaterThan(expected) {
      if (!(actual > expected)) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },

    toBeLessThan(expected) {
      if (!(actual < expected)) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    },

    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected ${JSON.stringify(actual)} to be truthy`);
      }
    },

    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected ${JSON.stringify(actual)} to be falsy`);
      }
    },

    toBeCloseTo(expected, precision = 2) {
      const diff = Math.abs(actual - expected);
      const threshold = Math.pow(10, -precision) / 2;
      if (diff > threshold) {
        throw new Error(`Expected ${actual} to be close to ${expected} (within ${threshold})`);
      }
    },

    toContain(item) {
      if (!actual.includes(item)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`);
      }
    },

    toHaveLength(length) {
      if (actual.length !== length) {
        throw new Error(`Expected length ${length}, got ${actual.length}`);
      }
    }
  };
}
