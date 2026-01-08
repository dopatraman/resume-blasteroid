const ResumeSection = {
  render() {
    return `
      <h1 class="section-title resume">Resume</h1>
      <div class="section-body">

        <div class="resume-section">
          <h2>Experience</h2>

          <div class="job-entry">
            <h3>Senior Software Engineer</h3>
            <div class="company">Tech Company Inc.</div>
            <div class="date">2022 - Present</div>
            <p>Led development of customer-facing features, mentored junior developers, and improved system performance by 40%.</p>
          </div>

          <div class="job-entry">
            <h3>Software Engineer</h3>
            <div class="company">Startup XYZ</div>
            <div class="date">2020 - 2022</div>
            <p>Built and maintained RESTful APIs, implemented CI/CD pipelines, and contributed to architecture decisions.</p>
          </div>

          <div class="job-entry">
            <h3>Junior Developer</h3>
            <div class="company">Agency ABC</div>
            <div class="date">2018 - 2020</div>
            <p>Developed responsive websites for clients, collaborated with designers, and learned best practices.</p>
          </div>
        </div>

        <div class="resume-section">
          <h2>Education</h2>

          <div class="job-entry">
            <h3>B.S. Computer Science</h3>
            <div class="company">University Name</div>
            <div class="date">2014 - 2018</div>
            <p>Focus on software engineering and data structures. Dean's List, GPA: 3.8</p>
          </div>
        </div>

        <div class="resume-section">
          <h2>Certifications</h2>
          <ul>
            <li>AWS Certified Solutions Architect</li>
            <li>Google Cloud Professional Developer</li>
            <li>MongoDB Certified Developer</li>
          </ul>
        </div>

      </div>
    `;
  }
};
