import type { ResumeData } from './types'

/**
 * English resume content — sourced from the original CV PDF.
 * This is the canonical / primary-language dataset.
 */
export const resumeEn: ResumeData = {
  personalInfo: {
    fullName: 'OMKAR KIRANE',
    phone: '+91 8208419063',
    email: 'omkarkirane.dev@gmail.com',
    linkedInUrl: 'https://www.linkedin.com/in/omkar-kirane',
    linkedInLabel: 'LinkedIn Profile',
    portfolioUrl: 'https://omkarkirane.dev',
    portfolioLabel: 'Portfolio',
    location: 'Pune, Maharashtra',
  },

  professionalSummary:
    'Software engineer with 6+ years of experience building high-performance, scalable web and mobile applications across fintech, edtech, e-commerce, and enterprise domains. Proficient in React, Next.js, TypeScript, and modern front-end architecture with a strong emphasis on clean code, accessibility, and user experience. Experienced in leading front-end teams, mentoring developers, and collaborating with cross-functional stakeholders to ship impactful products.',

  experience: [
    {
      company: 'Crystal Delta',
      location: 'Chennai, Tamil Nadu, India',
      title: 'Software Engineer - II',
      period: 'Dec 2025 – Present',
      bullets: [
        'Designed and developed scalable, high-performance cross-platform mobile applications using React Native for Android and iOS.',
        'Collaborated closely with product managers, UI/UX designers, and backend engineers to deliver business-critical features in an agile environment.',
        'Architected clean, reusable, and maintainable component structures following best practices and modular design principles.',
        'Optimized application performance, stability, and user experience across multiple devices and OS versions.',
        'Debugged and resolved production issues, ensuring smooth deployment, release cycles, and post-release support.',
        'Tech Stack: React Native, TypeScript, JavaScript (ES6+), Redux Toolkit.',
      ],
    },
    {
      company: 'Bajaj Finserv Direct Limited',
      location: 'Pune',
      title: 'Software Engineer',
      period: 'May 2024 – Oct 2025',
      bullets: [
        "Spearheaded the front-end architecture of Bajaj Finserv's digital lending platforms using Next.js, React, and TypeScript, serving millions of users monthly.",
        'Implemented secure payment workflows integrating Razorpay, Cashfree, and internal APIs with end-to-end encryption and PCI DSS compliance.',
        'Built reusable component libraries and design systems in collaboration with UX teams, reducing UI development time by 40%.',
        'Developed and maintained RESTful API integrations with backend microservices using Axios, SWR, and custom hooks for state management.',
        'Led code review processes and established front-end coding standards across the engineering team.',
      ],
    },
    {
      company: 'VMEdulife Software Pvt. Ltd.',
      location: 'Pune',
      title: 'Full Stack Developer',
      period: 'Dec 2022 – May 2024',
      bullets: [
        'Architected and delivered real-time video conferencing, screen sharing, and collaborative whiteboard features using WebRTC, Socket.IO, and Canvas API.',
        'Built multi-platform support for Android, iOS, Android TV, and Web using React Native and responsive React components.',
        'Engineered server-side rendering pipelines with Next.js for improved SEO and initial load performance.',
        'Integrated third-party services including Firebase, Stripe, Twilio, and AWS S3 for authentication, payments, messaging, and storage.',
        'Mentored junior developers and conducted technical workshops on React patterns and testing best practices.',
      ],
    },
    {
      company: 'Code Symphony LLP',
      location: 'Jamnagar',
      title: 'Full Stack Developer',
      period: 'Oct 2021 – Oct 2022',
      bullets: [
        'Developed Bluebird — a social networking and content management platform with real-time messaging, news feeds, and media uploads.',
        'Built Compose — a music discovery and playlist sharing application with audio streaming, dynamic playlists, and social features.',
        'Created Shopout — a multi-vendor e-commerce platform with inventory management, order tracking, and payment gateway integration.',
        'Implemented CI/CD pipelines using GitHub Actions and Docker, reducing deployment time by 60%.',
      ],
    },
    {
      company: 'BOLT Technology',
      location: 'Pune',
      title: 'Jr. Software Developer (Intern)',
      period: 'Oct 2020 – Oct 2021',
      bullets: [
        'Contributed to the development of responsive web applications using React, Redux, and Material UI.',
        'Assisted in API development with Node.js and Express, including database schema design with MongoDB.',
        'Participated in Agile ceremonies and contributed to sprint planning, daily standups, and retrospectives.',
        'Wrote unit and integration tests using Jest and React Testing Library.',
      ],
    },
  ],

  education: [
    {
      institution: 'Padmabhooshan Vasantdada Patil Institute of Technology',
      location: 'Pune',
      degree: 'BE Computer Engineering',
      result: 'CGPA: 8.19/10',
      period: 'Aug 2018 – June 2021',
    },
    {
      institution: 'Government Polytechnic',
      location: 'Miraj',
      degree: 'Diploma Computer Engineering',
      result: '86.69%',
      period: 'June 2015 – July 2018',
    },
    {
      institution: 'D. K. Palkar School',
      location: 'Karad',
      degree: 'SSC (X)',
      result: '84.80%',
      period: 'June 2014 – May 2015',
    },
  ],

  skills: [
    {
      category: 'Tech Languages',
      items: 'JavaScript (ES6+), TypeScript, HTML5, CSS3/SCSS, Python, SQL',
    },
    {
      category: 'Technical Skills',
      items:
        'React.js, Next.js, React Native, Redux, Zustand, TanStack Query, Node.js, Express.js, GraphQL, REST APIs, WebRTC, Socket.IO, Three.js',
    },
    {
      category: 'Database Management',
      items: 'MongoDB, PostgreSQL, MySQL, Firebase Realtime DB, Redis',
    },
    {
      category: 'Hosting Platforms',
      items: 'AWS (S3, EC2, Lambda), Vercel, Netlify, DigitalOcean, Heroku',
    },
    {
      category: 'Domain Knowledge',
      items: 'Fintech, EdTech, E-commerce, SaaS, Real-time Communication',
    },
    {
      category: 'Version Control',
      items: 'Git, GitHub, GitLab, Bitbucket',
    },
    {
      category: 'Platforms',
      items: 'Linux, macOS, Windows, Docker, Kubernetes',
    },
    {
      category: 'Designing & Dev Tools',
      items: 'Figma, Adobe XD, Storybook, Chromatic, VS Code, WebStorm',
    },
    {
      category: 'Project Management Tools',
      items: 'Jira, Confluence, Notion, Trello, Linear',
    },
    {
      category: 'Additional Skills',
      items:
        'Performance Optimisation, Accessibility (WCAG 2.1), SEO, Responsive Design, Micro-frontends, Design Systems, CI/CD',
    },
    {
      category: 'Interpersonal Skills',
      items:
        'Team Leadership, Mentoring, Cross-functional Collaboration, Technical Communication, Agile/Scrum',
    },
  ],

  contributions: [
    {
      company: 'Crystal Delta',
      bullets: [
        'Built cross-platform mobile applications using React Native serving users across Android and iOS devices.',
        'Established modular component architecture that improved code reusability and maintainability across the team.',
        'Optimised app performance and stability through profiling, lazy loading, and efficient state management.',
        'Collaborated with cross-functional stakeholders to ship business-critical features on tight release cycles.',
      ],
    },
    {
      company: 'Bajaj Finserv Direct Limited',
      bullets: [
        'Established clean architecture patterns and reusable component libraries that became the standard for all front-end teams.',
        'Designed and implemented secure payment workflows handling transactions worth crores monthly with zero security incidents.',
        'Built comprehensive REST API integration layer with robust error handling, retry logic, and offline support.',
        'Reduced page load times by 45% through code splitting, lazy loading, and image optimisation strategies.',
      ],
    },
    {
      company: 'VMEdulife Software Pvt. Ltd.',
      bullets: [
        'Delivered real-time video conferencing supporting 100+ concurrent users with adaptive bitrate streaming and fallback mechanisms.',
        "Built collaborative screen sharing and whiteboard tools that became core features of the platform's virtual classroom product.",
        'Engineered multi-platform support enabling seamless experiences across Android, iOS, Android TV, and Web browsers.',
        'Reduced customer-reported bugs by 35% through implementation of comprehensive testing strategies and automated QA pipelines.',
      ],
    },
    {
      company: 'Code Symphony LLP',
      bullets: [
        'Shipped three production applications (Bluebird, Compose, Shopout) within 12 months, each with 10,000+ active users.',
        'Implemented real-time features across all platforms using WebSocket architecture with message queuing and delivery guarantees.',
        'Built scalable media upload and processing pipelines handling 50,000+ files daily with automatic compression and CDN distribution.',
      ],
    },
  ],

  extracurricular: [
    {
      title: 'Technical Blog Author',
      description:
        'Published articles on React performance optimisation, TypeScript best practices, and modern front-end architecture.',
    },
    {
      title: 'Open Source Contributor',
      description:
        'Active contributor to React and TypeScript ecosystem libraries with multiple accepted pull requests.',
    },
    {
      title: 'Community Workshop Lead',
      description:
        'Conducted workshops on React, TypeScript, and modern web development at local developer meetups and college events.',
    },
    {
      title: 'Hackathon Participant',
      description:
        'Regular participant in hackathons with multiple top-3 finishes at college and city-level events.',
    },
    {
      title: 'College Technical Committee',
      description:
        "Served as Technical Head of the Computer Engineering Department's student technical committee.",
    },
  ],

  awards: [
    {
      title: 'Star Performer Award — Bajaj Finserv',
      description:
        'Recognised for exceptional contributions to the digital lending platform and for establishing front-end best practices.',
    },
    {
      title: 'Best Innovation Award — VMEdulife',
      description:
        'Awarded for architecting the real-time video conferencing solution that became a key product differentiator.',
    },
    {
      title: 'Academic Excellence — PVPIT',
      description:
        'Consistently ranked in the top 5% of the Computer Engineering department throughout the degree programme.',
    },
  ],

  interests: [
    {
      title: 'Web Performance & Optimisation',
      description:
        'Passionate about building fast, efficient web applications with optimal Core Web Vitals scores.',
    },
    {
      title: 'Accessibility Advocacy',
      description:
        'Committed to making web applications accessible to all users, following WCAG 2.1 AA standards.',
    },
    {
      title: 'Design Systems',
      description:
        'Interested in building and maintaining scalable design systems that bridge design and development.',
    },
    {
      title: 'Creative Coding',
      description:
        'Exploring Three.js, WebGL, and generative art as a creative outlet and technical challenge.',
    },
  ],
}
