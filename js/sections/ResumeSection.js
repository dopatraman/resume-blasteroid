const ResumeSection = {
  renderBullet(bullet) {
    // Handle bullet with sub-bullets (object format)
    if (typeof bullet === 'object' && bullet.text) {
      const subBulletsHtml = (bullet.subBullets || [])
        .map(sub => `                <li>${sub}</li>`)
        .join('\n');

      return `            <li>${bullet.text}
              <ul class="sub-bullets">
${subBulletsHtml}
              </ul>
            </li>`;
    }

    // Handle simple string bullet
    return `            <li>${bullet}</li>`;
  },

  renderJobEntry(exp) {
    const bullets = exp.bullets || [];

    const bulletsHtml = bullets
      .map(bullet => this.renderBullet(bullet))
      .join('\n');

    const bulletsList = bulletsHtml ? `
          <ul>
${bulletsHtml}
          </ul>` : '';

    return `
          <div class="job-entry">
            <h3>${exp.title}</h3>
            <div class="company">${exp.company_name}</div>
            <div class="date">${exp.from} - ${exp.to} | ${exp.location}</div>
            <p>${exp.description}</p>${bulletsList}
          </div>`;
  },

  render() {
    const data = window.resumeData || resumeData || {};
    const experiences = data.experiences || [];

    const jobEntriesHtml = experiences
      .map(exp => this.renderJobEntry(exp))
      .join('\n');

    return `
      <h1 class="section-title resume">Resume</h1>
      <div class="section-body">

        <div class="resume-section">
          <h2>Experience</h2>
${jobEntriesHtml}
        </div>

      </div>
    `;
  }
};
