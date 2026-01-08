const WorkSection = {
  render() {
    return `
      <h1 class="section-title work">Work</h1>
      <div class="section-body">
        <p>Here are some projects I've worked on. Each one represents a unique challenge and learning experience.</p>

        <div class="project-card">
          <h3>Project Alpha</h3>
          <p>A full-stack web application for managing team workflows and project timelines.</p>
          <div class="tech-stack">React, Node.js, PostgreSQL, Docker</div>
        </div>

        <div class="project-card">
          <h3>Project Beta</h3>
          <p>Mobile-first e-commerce platform with real-time inventory management.</p>
          <div class="tech-stack">React Native, Firebase, Stripe API</div>
        </div>

        <div class="project-card">
          <h3>Project Gamma</h3>
          <p>Data visualization dashboard for analyzing user engagement metrics.</p>
          <div class="tech-stack">D3.js, Python, AWS Lambda</div>
        </div>

        <div class="project-card">
          <h3>Project Delta</h3>
          <p>CLI tool for automating development environment setup and configuration.</p>
          <div class="tech-stack">Go, Shell, GitHub Actions</div>
        </div>
      </div>
    `;
  }
};
