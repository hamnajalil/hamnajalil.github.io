// All copy lives here. Facts come from the public portfolio, which moved to hamnajalil.com/portfolio/ on 2026-11-16
// when this room became the home page (Ham's decision). Résumé and sprint health keep their old addresses.
// `wins` (results) and `story` (challenge, what I did) are taken from the case studies on hamnajalil.com (Ham allowed results
// on cards on 2026-11-15, money figures included). Every chip is one of the site's own outcome chips, word for word.
export const WORKS = [
  { id: 'phoenix', story: { challenge: "Seasonal features from a 50+ person team across 4 time zones, without disrupting live services or missing a seasonal launch.", did: "Co-owned the roadmap with the Game Director, led sprint planning, and unblocked dependencies across engineering, art, design and QA." }, wins: ["+40% pipeline efficiency", "Zero missed seasonal launches", "50+ team aligned", "700K+ installs", "$40M ecosystem"], link: 'https://hamnajalil.com/portfolio/#quests', linkText: 'Full case study', short: 'Phoenix Flight', kind: 'AAA live service', title: 'Skyborne Phoenix Flight', img: 'studio/img/skyborne-phoenix-flight.webp', tags: ['Live Ops', 'Multi-timezone'],
    text: 'A live AAA cozy MMORPG. I ran seasonal feature production with a cross-continental team spanning engineering, art, design and QA.' },
  { id: 'arcade', story: { challenge: "Scaling a Web3 gaming ecosystem across several titles at once, while keeping quality, velocity and stakeholder confidence.", did: "Production strategy across the ecosystem: stakeholder reporting, cross-title dependencies, milestone tracking and the risk registry." }, wins: ["700K+ installs", "$40M+ ecosystem", "$50M+ in-game revenue", "Multi-title shipped"], link: 'https://hamnajalil.com/portfolio/#quests', linkText: 'Full case study', short: 'RCADE', kind: 'Web3 gaming', title: 'RCADE Network', img: 'studio/img/rcade-network-icon.webp', tags: ['Roadmap', 'Web3'],
    text: 'Venture-backed Web3 gaming infrastructure across multiple titles. I co-owned the product roadmap with the game director.' },
  { id: 'genesis', story: { challenge: "Launching a Web3 product inside an existing IP, so that blockchain systems enhanced the player experience instead of complicating it.", did: "Co-owned product strategy and delivery, translating blockchain constraints into player-facing feature decisions." }, wins: ["On-time launch", "Seamless IP integration", "NFT systems live", "Browser-native delivery"], link: 'https://hamnajalil.com/portfolio/#quests', linkText: 'Full case study', short: 'Genesis', kind: 'Web3 browser game', title: 'Skyborne Genesis', img: 'studio/img/skyborne-genesis-art.webp', tags: ['Web3', 'NFT', 'Browser'],
    text: 'A browser-based product with NFT-driven progression and interoperable assets inside the Skyborne universe.' },
  { id: 'dastaan', story: { challenge: "Building a 30-person team's production structure from scratch, with no existing pipeline and aggressive timeline pressure.", did: "End-to-end producer: defined scope, built the milestone plan and owned cross-discipline coordination from day one to ship." }, wins: ["30+ team shipped", "On-scope delivery", "Full 0→1 lifecycle"], link: 'https://hamnajalil.com/portfolio/#quests', linkText: 'Full case study', short: 'Dastaan', kind: 'Tactical RPG', title: 'Dastaan', img: 'studio/img/dastaan.jpg', tags: ['Concept to launch'],
    text: 'A turn-based tactical RPG. I was the end-to-end producer: scope, milestone plan and cross-discipline coordination, from concept to full launch.' },
  { id: 'festival', story: { challenge: "Balancing ambitious simulation depth with resource constraints and hard delivery deadlines.", did: "Feature scoping, resource allocation and milestone planning with the design and engineering leads." }, wins: ["On-time delivery", "6 milestone builds on schedule", "15% under budget"], link: 'https://hamnajalil.com/portfolio/#quests', linkText: 'Full case study', short: 'Festival Tycoon', kind: 'Simulation', title: 'Music Festival Tycoon', img: 'studio/img/music-festival-tycoon.webp', tags: ['Scoping', 'Milestones'],
    text: 'A simulation title. I managed feature scoping, resource allocation and milestone planning with the design and engineering leads.' },
  { id: 'wig', link: 'https://hamnajalil.com/portfolio/#achievements', linkText: 'See it on my site', short: 'Women in Games', kind: 'Community', title: 'Women in Games ambassador', art: 'star', badge: 'studio/img/women-in-games.webp', tags: ['Equity', 'Inclusion', 'Opportunity'],
    text: 'I am an International Women in Games ambassador, advocating for equity, inclusion and opportunity across the games industry.' },
  { id: 'certs', link: 'https://hamnajalil.com/portfolio/#achievements', linkText: 'See the certificates', short: 'Certificates', kind: 'Certifications', title: 'The certificate shelf', art: 'logos', tags: ['Project management', 'Agile', 'Scrum', 'Machine learning'],
    text: 'Google Project Management, Agile with Atlassian Jira, IBM Scrum Master, and the Stanford Machine Learning specialization.' },
  { id: 'sprint', short: 'Sprint health', kind: 'Tool I built', title: 'Sprint health', art: 'chart', tags: ['Built by me', 'Live on my site'],
    text: 'A sprint health tool I built for my portfolio, because production craft should be something you can click on.',
    link: 'https://hamnajalil.com/sprint-health/', linkText: 'Open sprint health' },
];

export const ABOUT = [
  'I am Hamna Jalil, a game producer and product manager. I work across AAA, Web3 and live-service games.',
  'I grew up fascinated by the invisible systems that make games feel alive: the pacing, the feedback loops, the way a team\'s work becomes someone else\'s joy. A computer science degree gave me the language for those systems. Production gave me the tools to build them at scale.',
  'As a producer, I turn vision into structure. I lead multi-timezone teams across art, design and engineering, and I keep leadership and the people doing the work reading from the same page.',
  'Outside production I am curious about quantum mechanics, the history of civilisations and robotics. It is the same curiosity that makes me love games.',
];

export const TOPICS = [
  { id: 'sprint', title: 'Sprint architecture', blurb: 'Ceremonies and dashboards that make delivery predictable.',
    lines: ['Short sprints with structured ceremonies: standups, refinement, retros.', 'Custom dashboards track velocity, blockers and cross-team dependencies.', 'Everyone watches the same board in real time.'] },
  { id: 'risk', title: 'Risk escalation', blurb: 'A living risk register and a fast triage drill.',
    lines: ['Every risk lives in one register, scored and owned.', 'When a top-priority issue surfaces: triage, scope the impact, assign owners.', 'Communicate up and across quickly. No surprises at milestone reviews.'] },
  { id: 'stake', title: 'Stakeholder alignment', blurb: 'One page that leadership and the team both read.',
    lines: ['Weekly executive summaries.', 'Async video updates for distributed teams.', 'Structured decision logs, so nobody argues from memory.'] },
  { id: 'retro', title: 'Data-driven retros', blurb: 'Feedback turned into process changes, not sticky notes.',
    lines: ['Every sprint ends with a metrics-backed retrospective.', 'Velocity trends, bug escape rates, scope creep ratios.', 'Team feedback becomes concrete process changes.'] },
];

export const METHOD = 'Systems, not heroics. Every process I build is designed to make great work repeatable.';

// ---- shown as pictures and chips in Notes and on the desktop (all from the public site)
export const PROFILE = {
  name: 'Hamna Jalil',
  portrait: 'studio/img/portrait.jpg', // the picture Ham chose for herself (2026-11-16); remove this line to go back to the HJ monogram
  role: 'Game Producer · Product Manager',
  line: 'I turn vision into structure, and creative ambition into shipped games.',
  facts: [['Class', 'Game Producer · PM'], ['Education', 'BSc Computer Science'], ['Worlds', 'AAA · Web3 · Live service'], ['Status', 'Open to work']],
  interests: ['Games', 'Travel', 'History', 'Robotics', 'Quantum mechanics'],
};
export const STUDIOS = [
  { name: 'Revolving Games', role: 'Associate Product Manager', img: 'studio/img/revolving-games.jpg' },
  { name: 'FRAG Games', role: 'Technical Project Manager / Producer', img: 'studio/img/frag-games.jpg' },
  { name: 'Computing Solutions', role: 'Technical Project Coordinator', img: 'studio/img/computing-solutions.jpg' },
];
export const CERTS = [
  { name: 'Project Management', by: 'Google', img: 'studio/img/google.jpg' },
  { name: 'Agile with Atlassian Jira', by: 'Atlassian', img: 'studio/img/atlassian.jpg' },
  { name: 'Scrum Master', by: 'IBM', img: 'studio/img/ibm.jpg' },
  { name: 'Project Management Specialization', by: 'UC Boulder', img: 'studio/img/uc-boulder.jpg' },
  { name: 'Machine Learning Specialization', by: 'Stanford', img: 'studio/img/stanford.jpg' },
];
export const LOADOUT = [
  { name: 'PM Toolkit', sub: 'Planning and tracking', color: '#ff8a5c', items: ['Jira', 'Confluence', 'Linear', 'Notion'] },
  { name: 'Design Arsenal', sub: 'Visual collaboration', color: '#ff5fa2', items: ['Figma', 'Miro', 'FigJam'] },
  { name: 'Dev Forge', sub: 'Technical fluency', color: '#4cc9f0', items: ['GitHub', 'CI/CD', 'C++', 'Python', 'SQL'] },
  { name: 'Strategy Grimoire', sub: 'Prioritisation and vision', color: '#b08cff', items: ['OKRs', 'RICE', 'MoSCoW', 'Roadmapping'] },
  { name: 'Agile Mastery', sub: 'Ceremonies and cadence', color: '#3ddc84', items: ['Scrum', 'Kanban', 'Retros', 'Sprint Planning'] },
  { name: 'Game Ops', sub: 'Live production', color: '#ffd166', items: ['Live Ops', 'GDD', 'QA Pipeline', 'Dependency tracking'] },
];
export const LINKS = { site: 'https://hamnajalil.com/portfolio/', sprint: 'https://hamnajalil.com/sprint-health/', resume: 'https://hamnajalil.com/HAMNA_JALIL.pdf', contact: 'https://hamnajalil.com/portfolio/#contact', linkedin: 'https://linkedin.com/in/hamnabukhari' };
export const TODO = [[true, 'Ship the portfolio'], [true, 'Put a computer inside the portfolio'], [false, 'Stop adding features to the computer'], [false, 'Touch grass (blocked: weather)']];
export const TRY = [
  { app: 'terminal', t: 'Terminal', d: 'Type help, fortune or standup' },
  { app: 'paint', t: 'Paint', d: 'Draw one wing, get two' },
  { app: 'pads', t: 'Beat pad', d: 'Press Play, then A to K' },
  { app: 'game', t: 'Backlog breaker', d: 'Move the mouse to take the paddle' },
  { app: 'settings', t: 'Settings', d: 'Change the wallpaper, then look at the room' },
];

// ---- the tour (R9, wording approved by Ham on 2026-11-15): the eight pieces in story order, each with one linking line.
// What she runs now, what she shipped before, how she works, what she gives back. Each line only restates its card.
export const TOUR = [
  { id: 'phoenix', line: 'Start with what I run today: a live game that cannot miss a season.' },
  { id: 'arcade', line: 'Phoenix Flight is one title. This is the ecosystem around it.' },
  { id: 'genesis', line: 'Same universe, new ground: bringing Web3 into a world players already loved.' },
  { id: 'dastaan', line: 'A different kind of problem, the blank page: a team and a pipeline built from nothing.' },
  { id: 'festival', line: 'And the opposite problem: big ambitions, fixed budget, hard dates.' },
  { id: 'sprint', line: 'How I do it is not a secret. This is a tool I built so you can try it.' },
  { id: 'certs', line: 'The method behind the tool, on paper.' },
  { id: 'wig', line: 'And what I give back to the industry that gave me all of this.' },
];

// ---- arrival, and the "say hello" panel (wording and quotes from the public site)
export const INTRO = {
  hint: 'Eight pieces of my work hang in this room. Pick one, or step into the monitor.',
  how: 'Drag to walk around the desk · Scroll to step closer',
  howTouch: 'Drag to look around · Pinch to step closer',
  status: 'Open to work',
  motto: 'Systems, not heroics.',
  // G13 proof on arrival: three results shown under the name for the first seconds. Each is on a work card already,
  // worded as on hamnajalil.com. Money figures included by Ham's choice (2026-11-16: "Add money figures").
  proof: [['700K+', 'installs'], ['$50M+', 'in-game revenue'], ['$40M+', 'ecosystem'], ['+40%', 'pipeline efficiency'], ['Zero', 'missed seasonal launches']],
  crewHint: 'Read the recommendations',
  loading: 'Opening the studio',
  plain: 'The 3D studio could not start on this device, so here is the short version.',
  tour: 'Take the tour', home: 'Back to start', soundOff: 'Enable sound',
};
// written in the stars of the dome (the skill names from the public site)
export const SKILLS = ['Sprint planning', 'Risk mitigation', 'Stakeholder alignment', 'Roadmap strategy', 'Cross-timezone leadership'];
export const HELLO = {
  title: "Let's make something.",
  open: 'Open to Senior Producer & Product roles', // wording from hamnajalil.com (Ham, 2026-11-16)
  text: "Have a game that needs a great producer? Building something ambitious? I'd love to hear from you.",
  crew: 'Words from the crew', crewSub: 'Message bottles from people I have worked with',
};
// `q` + `hi` are the short lines for the say-hello panel; `full` + `fhi` are the whole recommendation, word for word
// from the public site, with the phrase the site itself emphasises. The first five appear in the panel.
export const QUOTES = [
  { by: 'Darryl Kay', role: 'Emmy-nominated Producer', rel: 'Direct manager', img: 'studio/img/people/darryl.jpg',
    q: 'Hamna cares. She always puts the team first and her strength in multi-tasking is unparalleled.', hi: 'Hamna cares.',
    full: 'Hamna cares. She always puts the team first and her strength in multi-tasking is unparalleled. Her ability to maintain clarity in complex situations proved vital. If you need someone reliable who keeps projects on track and works well with any team, look no further.',
    fhi: 'She always puts the team first and her strength in multi-tasking is unparalleled.' },
  { by: 'Vikki Ruttle', role: 'Design Director, Revolving Games', rel: 'Same team', img: 'studio/img/people/vikki.jpg',
    q: 'Her ability to juggle complex priorities and anticipate challenges before they become issues is unmatched.', hi: 'anticipate challenges before they become issues',
    full: 'A powerhouse producer — incredibly hardworking, razor-sharp, and always on top of every detail. Her ability to juggle complex priorities and anticipate challenges before they become issues is unmatched. Hamna has been my hero at work — someone I could always count on. Any team would be incredibly lucky to have her.',
    fhi: 'A powerhouse producer — incredibly hardworking, razor-sharp, and always on top of every detail.' },
  { by: 'Christopher Arrington', role: 'Director of Product, Revolving Games', rel: 'Direct manager', img: 'studio/img/people/christopher.jpg',
    q: 'Any team should consider themselves lucky to have someone like Hamna as part of their production team.', hi: 'lucky to have someone like Hamna',
    full: 'She is smart but always willing to learn and produced and managed pipelines across engineering, QA, art, and design — keeping everyone aligned towards project goals across all levels of the team. Any team should consider themselves lucky to have someone like Hamna as part of their production team.',
    fhi: 'produced and managed pipelines across engineering, QA, art, and design' },
  { by: 'Martin Talbot', role: 'Game Director, Revolving Games', rel: 'Same team', img: 'studio/img/people/martin.jpg',
    q: 'Hamna brought structure, clarity, and passion to production, keeping schedules and priorities aligned.', hi: 'structure, clarity, and passion',
    full: 'Hamna brought structure, clarity, and passion to production, keeping schedules and priorities aligned. She adapted to constantly shifting priorities and improved processes between teams in North America and Pakistan. A collaborative partner (and very competitive gamer 🎮), she elevated both the quality of the work and the culture of the team!',
    fhi: 'She adapted to constantly shifting priorities and improved processes between teams in North America and Pakistan.' },
  { by: 'Leo Talento', role: 'Art Director, Revolving Games', rel: 'Same team', img: 'studio/img/people/leo.jpg',
    q: 'She is an effective leader and someone you can trust.', hi: 'someone you can trust',
    full: 'She demonstrates great foresight, keeps communication clear and professional, and ensures every conversation is well-organized and every schedule well-structured. Hamna is highly responsive, adapts quickly to any situation, connects easily with people, and anticipates needs across a broad scope. She is an effective leader and someone you can trust.',
    fhi: 'ensures every conversation is well-organized and every schedule well-structured.' },
  { by: 'Iggy Medeiros', role: 'Art Director, Revolving Games', rel: 'Same team', img: 'studio/img/people/iggy.jpg',
    full: 'She helped lead a team of artists and designers across multiple time zones, always bringing attention to detail, adaptability, and proactive leadership that shaped the direction of our products. Beyond her professional strengths, she genuinely cared about the people she worked with, making her a trusted and valued teammate.',
    fhi: 'always bringing attention to detail, adaptability, and proactive leadership' },
  { by: 'Boris Giftge', role: 'Head of Engineering, Revolving Games', rel: 'Senior colleague', img: 'studio/img/people/boris.jpg',
    full: "She showed great initiative and earned the team's respect through her positive attitude, reliability, and willingness to take on challenges outside her comfort zone. Even when things felt overwhelming, she stayed focused and helped keep the team moving forward. I'm confident she'll continue to grow into an excellent product leader.",
    fhi: 'positive attitude, reliability, and willingness to take on challenges outside her comfort zone.' },
];
