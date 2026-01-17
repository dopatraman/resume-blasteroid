const AboutSection = {
  renderSkills(skills) {
    if (!skills || typeof skills !== 'object') return '';

    return Object.entries(skills).map(([category, items]) => {
      const itemsStr = items.join(' · ');
      return `          <li><strong>${category}:</strong> ${itemsStr}</li>`;
    }).join('\n');
  },

  render() {
    const data = window.resumeData || resumeData || {};
    const skillsHtml = this.renderSkills(data.skills);

    return `
      <h1 class="section-title about">About</h1>
      <div class="section-body">
        <h2>Hello, I'm ${data.name || '[Your Name]'}</h2>
        <p>${data.title || ''}</p>
        <p>
          ${data.description || ''}
        </p>

        <h2>Skills</h2>
        <ul>
${skillsHtml}
        </ul>

        <h2>Get In Touch</h2>
        <ul>
          <li>Email: ${data.email || ''}</li>
          <li>Phone: ${data.phone || ''}</li>
          <li>Location: ${data.location || ''}</li>
        </ul>
      </div>
    `;
  }
};
