import {
  faBrowser,
  faServer,
  faPresentationScreen,
  faGamepadModern,
  faChartSimple,
  faShop,
  faMessage,
  faPlane,
  faCog
} from "@fortawesome/pro-duotone-svg-icons";

import { Detail } from "@/types/details";
import { Github } from "@/types/general";
import { ProjectDetail } from "@/types/projects";
import { Resume } from "@/types/resume";
import { SectionIntros } from "@/types/sections-intros";
import { Service } from "@/types/services";
import { Skill } from "@/types/skills";


export interface PortfolioData {
  intro: string;
  cover: string;
  cv: string;
  typingsTitles: string[];
  details: Detail;
  github: Github[];
  stackoverflow: string;
  sections: {
    [x: string]: SectionIntros;
  };
  services: Service[];
  education: Resume[];
  experience: Resume[];
  skills: {
    design: Skill[];
    language: Skill[];
    tech: Skill[];
    tools: Skill[];
    expertise: Skill[];
    teamplayer: Skill[];
  };
  projects: ProjectDetail[];
  socialMedia: {
    byUsername: {
      twitter: string;
      instagram: string;
      facebook: string;
      linkedIn: string;
    };
    byProjectsUsername: {
      gameYt: string;
    };
  };
}

export const portfolioData: PortfolioData = {
  intro:
    "Hello! I’m <strong>Redeemer Pace</strong>. Let's get to know each other, shall we?",
  cover: "/images/cover-picture.webp",
  cv: "https://drive.google.com/file/d/1k2FJG0ZpKA76eCUg_mb1TlncqzOLsACg/view?usp=sharing",
  github: [
    {
      name: "Me",
      link: "https://github.com/red-game-dev",
    },
    {
      name: "GOZ",
      link: "https://github.com/AMW-Game-Entertainment",
    },
    {
      name: "SN",
      link: "https://github.com/animemixedworldgithub",
    },
  ],
  stackoverflow: "https://stackoverflow.com/users/15786039/ired-game-dev",
  typingsTitles: [
    "Your next <strong>Frontend Engineer</strong>",
    "Your next <strong>Backend Engineer</strong>",
    "Your next <strong>Architect</strong>",
    "Your next <strong>Game Developer</strong>",
    "Your next <strong>Game Consultant</strong>",
    "Your next <strong>App Developer</strong>",
    "Your next <strong>Software Engineer</strong>",
    "Your next <strong>Tech Consultant</strong>",
    "Your next <strong>Business Consultant</strong>",
    "Your next <strong>Marketing Consultant</strong>",
  ],
  sections: {
    services: {
      title: "What can I offer?",
      description: [
        "Looking for top-notch service? You're at the right place!",
      ],
    },
    design: {
      title: "Design Skills",
      description: [
        "Design may not be my main expertise, but I've handled numerous designs throughout my career.",
      ],
    },
    language: {
      title: "Language Skills",
      description: [
        "Most of the time, I communicate primarily in English, sometimes even more than in my mother tongue.",
      ],
    },
    tech: {
      title: "Programming Languages & Frameworks Skills",
      description: [
        "Have an overview of my expertise in tech. Are there any skills that interest you?",
      ],
    },
    tools: {
      title: "Tools Skills",
      description: [
        "I generally use a variety of tools. Some I use less often, and some more, depending on the current task.",
      ],
    },
    expertise: {
      title: "Expertise",
      description: [
        "I have expertise in various roles; each provides a snapshot of my overall knowledge.",
      ],
    },
    teamplayer: {
      title: "Team Player",
      description: [
        "While skills are important, being a team player is essential for success of the team. We're together in this and we solve things together.",
      ],
    },
    projects: {
      title: "Projects & Achievements",
      description: [
        "Let's discuss my projects. Here's a brief overview of some significant ones.",
      ],
    },
    recommendations: {
      title: "Recommendations",
      description: [
        "I have recommendation letters from top companies such as KPMG, AuthenticGaming, and more! These can be viewed upon request.",
      ],
    },
    conclusion: {
      title: "Wow!",
      description: [
        `
        You made it to the end! How did you find my journey? 
        If you'd like to reach out, the best time would be after 4:30 PM CET on business days. I look forward to our future conversation!
      `,
      ],
    },
  },
  details: {
    name: "Redeemer Pace",
    intro: "Experienced, trusted",
    description: `
    With over 10 years of experience as a Software Engineer, specializing in Game Development, Web Development, Tech Consultancy, Architecture, and Marketing, 
    I have developed a strong foundation in the tech industry. 
    My journey began at the early age of 7 when I started programming as a hobby, which taught me valuable lessons through challenging experiences. What's next? 
    I am passionate about innovation, continuous learning, and contributing to the tech community. I look forward to one day 
    creating a successful startup, provided the right investment opportunities arise.`,
    residence: "Maltese",
    location: "Remote Worldwide, Hybrid & on Site Thailand",
    jobType:
      "B2B (C2C, Individual Freelance) / Full-Time / Part-Time / Temporary",
    phone: "+356 79323059",
    email: "red.pace.dev@gmail.com",
    image: "/images/profile.webp",
    contactTime: "Anytime in any timezone",
    isFlexible: false,
  },
  services: [
    {
      title: "Frontend Enginering",
      icon: faBrowser,
      description: "",
    },
    {
      title: "Backend Enginering",
      icon: faServer,
      description: "",
    },
    {
      title: "Tech Consultancy",
      icon: faPresentationScreen,
      description: "",
    },
    {
      title: "Engineering Manager",
      icon: faPresentationScreen,
      description: "",
    },
    {
      title: "Tech Lead/Team Lead",
      icon: faPresentationScreen,
      description: "",
    },
    {
      title: "Game Consultancy",
      icon: faGamepadModern,
      description: "",
    },
    {
      title: "Business Consultancy",
      icon: faChartSimple,
      description: "",
    },
    {
      title: "Marketing Consultancy",
      icon: faShop,
      description: "",
    },
    {
      title: "Build Custom GPT",
      icon: faMessage,
      description: "",
    },
    {
      title: "TasteTravellers Collaborations",
      icon: faPlane,
      description: "",
    },
    {
      title: "AI Generated APP? Lets fix, especially if under attack",
      icon: faCog,
      description: "",
    },
  ],
  experience: [
    {
      title: "Senior Full Engineer, HyperPlay Labs",
      from: "Oct 2023",
      description: [
        "An interesting company that offers NFT rentals, integrating with various industries like gaming.",
        "Tech Stack:  React, NextJs, Electron, Architecture",
      ],
    },
    {
      title: "Senior Frontend Engineer, reNFT Labs",
      from: "Jan 2023",
      to: "Aug 2023",
      description: [
        "An interesting company that offers NFT rentals, integrating with various industries like gaming.",
        "Tech Stack:  React, NextJs, Architecture",
      ],
    },
    {
      title: "Founder, CEO at TasteTravellers",
      from: "Feb 2018",
      description: [
        "Our popular travel page & community",
        `We focus on bringing authentic travel experiences to their audience and 
        we're engaged in creating and sharing high-quality content related to food, drinks, travel destinations, and accommodations.`,
        "Tech Stack: Shopify",
      ],
    },
    {
      title: "Founder, CEO & CTO, Gods of Zushin",
      from: "Apr 2015",
      description: [
        "An achievement on it's own with over 5 years in production environment.",
        "A Game MMORPG project developed during studies to enhance my knowledge in various of areas, which can be discuss.",
        `Tech Stack: C/C++, Lua, SQL, Python, VueJS, PHP Laravel, NodeJs, C#, Algorithms, Cryptography, Compressions, Architecture,
        Photopshop, Illustrator`,
      ],
    },
    {
      title: "Frontend Engineer, Chiliz",
      from: "Nov 2019",
      to: "Nov 2022",
      description: [
        `Worked with a blockchain and sports company as a Frontend Engineer and an unofficial Tech Lead. 
        We can discuss achievements further.`,
        `Tech Stack:  Nativescript, Vuejs, Webpack, Jest tests, Redux-observables, RxJs, Java/Kotlin, 
        Swift, React-Native, React, Ionic, Flutter, Architecture.`,
      ],
    },
    {
      title: "Chief Techonology Officer, CoinOn",
      from: "Nov 2021",
      to: "Jan 2022",
      description: [
        "Delivered a full scale solution of website, mobile app and a blockchain infrastructure.",
        "Tech Stack: Flutter, NodeJs, Rust (Substrate), VueJs Nuxt.",
      ],
    },
    {
      title: "Software Developer, KPMG",
      from: "Feb 2019",
      to: "Sep 2019",
      description: [
        "Being hired by KPMG is one big achievement on it's own, as it is one of the big 4 firm in auditing.",
        "Tech Stack: PHP - Laravel, VueJS, Angular, NodeJS, React, C# ASP.NET, C/C++, Architecture",
      ],
    },
    {
      title: "Frontend Developer, AuthenticGaming",
      from: "Jul 2017",
      to: "Jan 2019",
      description: [
        `One of the companies that given me a lot of experiences throughout the years. 
        This company is an iGaming Company, which was my first experience in iGaming.`,
        "Tech Stack: React, Redux, Redux-observables, MongoDB, Kafka, SignalR, NodeJS, RxJs, Backbone, Canvas, PixJS / Vanilla JS Canvas, NodeJS",
      ],
    },
  ],
  education: [
    {
      title: "Online Courses",
      description: [
        "These courses has helped me enchance further knowledge for both pratical and theoretical",
        `Courses: Python, Architecture, Leadership, VueJS, Angular, React, Laravel, React Native, Ionic, NativeScript, 
        AI, Blockchain (Solidity, Substrate, Rust, Solana) and many more`,
      ],
      from: "Sep 2017",
    },
    {
      title:
        "Bachelor of Science (Honours) in Multimedia Software Development, MCAST",
      description: [
        "Although last year wasnt completed, I was able to learn a lot of interesting subjects",
        `Courses: C#, Blender, Game Development, Photoshop, Web Development, PHP, Maltese, English, Maths, 
        2D Animation with After Effects`,
      ],
      from: "Sep 2015",
      to: "Jun 2017",
    },
    {
      title: "Extended Diploma Computer Software Engineering, MCAST",
      description: [
        "Courses: C#, Blender, Photoshop, Web Development, PHP, Maltese, English, Maths, 2D Animation with After Effects",
      ],
      from: "Sep 2013",
      to: "Jun 2015",
    },
    {
      title: "Diploma Computer Software Engineering, MCAST",
      description: [
        "Courses: C#, Blender, Photoshop, Web Development, PHP, Maltese, English, Maths, 2D Animation with After Effects",
      ],
      from: "Sep 2011",
      to: "Jun 2013",
    },
  ],
  skills: {
    design: [
      {
        name: "Photoshop",
        score: 80,
      },
      {
        name: "Illustrator",
        score: 60,
      },
      {
        name: "Adobe XD",
        score: 40,
      },
      {
        name: "InVision",
        score: 50,
      },
      {
        name: "Figma",
        score: 70,
      },
      {
        name: "Blender",
        score: 40,
      },
      {
        name: "Maya",
        score: 40,
      },
    ],
    language: [
      {
        name: "Maltese",
        score: 100,
      },
      {
        name: "English",
        score: 90,
      },
      {
        name: "Italian",
        score: 70,
      },
    ],
    tech: [
      {
        name: "Vue",
        score: 90,
      },
      {
        name: "React",
        score: 90,
      },
      {
        name: "Angular",
        score: 40,
      },
      {
        name: "JQuery",
        score: 99,
      },
      {
        name: "WebGL",
        score: 80,
      },
      {
        name: "Typescript",
        score: 90,
      },
      {
        name: "Javascript",
        score: 90,
      },
      {
        name: "NodeJS",
        score: 60,
      },
      {
        name: "Flutter",
        score: 50,
      },
      {
        name: "React Native",
        score: 70,
      },
      {
        name: "Ionic",
        score: 20,
      },
      {
        name: "Cordova",
        score: 20,
      },
      {
        name: "NativeScript",
        score: 80,
      },
      {
        name: "C/C++",
        score: 70,
      },
      {
        name: "Python",
        score: 70,
      },
      {
        name: "Lua",
        score: 50,
      },
      {
        name: "PHP",
        score: 90,
      },
      {
        name: "Laravel",
        score: 60,
      },
      {
        name: "Sympfony",
        score: 40,
      },
      {
        name: "SQL",
        score: 90,
      },
      {
        name: "NoSQL",
        score: 90,
      },
      {
        name: "HTML / CSS",
        score: 90,
      },
      {
        name: "LESS / SASS",
        score: 70,
      },
      {
        name: "Bash",
        score: 80,
      },
      {
        name: "Electron",
        score: 40,
      },
      {
        name: "Golang",
        score: 10,
      },
      {
        name: "Rust",
        score: 40,
      },
      {
        name: "C#, .NET",
        score: 59,
      },
      {
        name: "Kotlin",
        score: 40,
      },
      {
        name: "Java",
        score: 40,
      },
      {
        name: "Swift",
        score: 20,
      },
      {
        name: "Ruby on Rails",
        score: 70,
      },
      {
        name: "Linq",
        score: 30,
      },
      {
        name: "Solidity",
        score: 50,
      },
      {
        name: "Solana",
        score: 30,
      },
      {
        name: "RxJS",
        score: 90,
      },
      {
        name: "Etherjs",
        score: 60,
      },
      {
        name: "Linq",
        score: 30,
      },
      {
        name: "Wagmi (React)",
        score: 70,
      },
      {
        name: "State Management",
        score: 90,
      },
      {
        name: "Firebase",
        score: 70,
      },
      {
        name: "NextJs",
        score: 90,
      },
      {
        name: "Graphql",
        score: 70,
      },
      {
        name: "Gatsby",
        score: 40,
      },
      {
        name: "Backbone",
        score: 60,
      },
      {
        name: "Kafka",
        score: 50,
      },
      {
        name: "SignalR",
        score: 50,
      },
      {
        name: "SocketIo",
        score: 90,
      },
      {
        name: "Ssh",
        score: 90,
      },
      {
        name: "OpenSSL",
        score: 60,
      },
      {
        name: "Canvas",
        score: 90,
      },
      {
        name: "PixiJs",
        score: 40,
      },
      {
        name: "Ramda",
        score: 60,
      },
      {
        name: "TheGraph",
        score: 50,
      },
      {
        name: "Alchemy",
        score: 60,
      },
    ],
    tools: [
      {
        name: "Git",
        score: 90,
      },
      {
        name: "Unity",
        score: 70,
      },
      {
        name: "Unreal Engine",
        score: 30,
      },
      {
        name: "Sky Engine",
        score: 5,
      },
      {
        name: "Nuxt",
        score: 50,
      },
      {
        name: "Visual Studio 2003-2022",
        score: 99,
      },
      {
        name: "VS Code",
        score: 90,
      },
      {
        name: "JetBrains Tools",
        score: 70,
      },
      {
        name: "Android Studo",
        score: 50,
      },
      {
        name: "XCode",
        score: 20,
      },
      {
        name: "SVN",
        score: 90,
      },
      {
        name: "Cloudflare",
        score: 90,
      },
      {
        name: "AWS",
        score: 30,
      },
      {
        name: "GCP",
        score: 40,
      },
      {
        name: "Digital Ocean",
        score: 90,
      },
      {
        name: "OVH Cloud",
        score: 90,
      },
      {
        name: "Vercel",
        score: 70,
      },
      {
        name: "Fastlane",
        score: 30,
      },
      {
        name: "Google Store & Apple Store",
        score: 90,
      },
      {
        name: "Docker",
        score: 80,
      },
      {
        name: "Wordpress",
        score: 67,
      },
      {
        name: "Shopify",
        score: 50,
      },
    ],
    expertise: [
      {
        name: "Frontend Engineer",
        score: 100,
      },
      {
        name: "Backend Engineer",
        score: 75,
      },
      {
        name: "Tech Lead",
        score: 55,
      },
      {
        name: "Engineer Manager",
        score: 30,
      },
      {
        name: "Game Engineer",
        score: 80,
      },
      {
        name: "Tech Consultancy",
        score: 75,
      },
      {
        name: "Architecture",
        score: 80,
      },
      {
        name: "Marketing",
        score: 50,
      },
      {
        name: "Entrepreneur",
        score: 75,
      },
      {
        name: "Managing",
        score: 70,
      },
      {
        name: "Designing",
        score: 40,
      },
      {
        name: "Algorithms",
        score: 65,
      },
      {
        name: "Encryption & Compressions",
        score: 80,
      },
    ],
    teamplayer: [
      {
        name: "Team work",
        score: 100,
      },
      {
        name: "Face to Face Communication",
        score: 100,
      },
      {
        name: "Remote Communication",
        score: 100,
      },
      {
        name: "Mentoring",
        score: 90,
      },
      {
        name: "Managing",
        score: 90,
      },
      {
        name: "Company Culture Follower",
        score: 100,
      },
      {
        name: "Contribute Ideas",
        score: 100,
      },
    ],
  },
  projects: [
    {
      image: "/images/chapter5-cover.webp",
      title: "Gods of Zushin",
      category: "Game | MMORPG",
      intro: `An achievement on it's own and personally is part of my work experience as well, 
      since during the weekends I do aim to work on interesting game updates which does grow my knowledge significantly. 
      Please be sure to check under "Work Experience" to learn further about the project details.
      
      I started since I started to studying, the main aim was to
      improve my skills in various of sectors. This project took me 4 and half years to
      completely finish it, yet is still ongoing with new improvements, new features every 6
      months to 1 year patches. The game uses various of programming languages, but thats just the tip of the iceberg.`,
      responsibilities: [
        "Maintain & Develop scalable solution",
        "Architecture of the whole Game Engine",
        "Design 3D/2D Modeling, Textures and such using Maya (Most of models were bought as it is time consuming)",
        "Introducing multiple payment methods such as Stripe, PayPal and many more",
        "Introducing Algorithms, Custom Compression & Custom Cryptographies for enterprise security, yet remain scalable",
        "Marketing using various of Social Media's and their ads tools",
        "Introducing new ways to increase profit such as Shopify for market branded items of the game",
        "Manging community",
        "Managing teams of Moderators, Event Coordinators, Game Developer",
        `Leading a company as a CEO, and as well technical aspect as CTO. 
         Initially I handled a lot as well financial and other needs and as 'One-man' army, 
         yet I've other members who does game testing, design, and such`,
        "Financial Bugdet allocation",
        "Monitor Social Technology Trends",
        "Identifiying possible opportunities of risks for business",
        "Maintain high security standards & follow all required processes for keeping the player safe at all times",
        "Monitor, evaluate & keep up to date with the regulations",
        "Monitor Analytics",
        "Lead and motivate",
        "Innovate innovative features to build an truly amazing game for the players",
        "Making high-quality investing decisions",
        "Create strategy for improve the business",
        "Review financial and non-financial reports",
        "Build trust relations with key partners and stakeholders",
        "Maintain a deep knowledge of the markets and industry",
        "Analyze problematic situations and occurrences and provide solutions",
        "Furthermore can be discussed about this project",
      ],
      techStack: [
        "C/C++",
        "Lua",
        "Python",
        "VueJS",
        "PHP Laravel",
        "C#",
        "Electron (Old Launcher)",
        "Cloudflare",
        "DigitalOcean",
        "AWS",
      ],
      link: "https://goz.fun",
      from: "Apr 2015",
    },
    {
      image: "/images/socialnetwork-amw.webp",
      title: "AMW - Social Network & Game",
      category: "Social Network, Game",
      intro: `Although this project was discontinued, I did manage back then to raise a 
      huge community related to Anime, Manga, Cosplay, Gaming. `,
      responsibilities: [
        "This was a social network similar to Facebook & google plus",
        "A small enjoyable game as part of the network, that when you interact you would earn points to build your customized character. ",
        `Each character could be customized any way you would like it to be, 
        while no limits were added such as for levels, enchancements and so on.`,
        `Included various of features such as auction, ads system similar to facebook, 
        character interaction as RPG, publish your own creations, chats and more`,
        "Marketing using various of Social Media's and their ads tools",
        "Monitor Analytics",
        "Furthermore can be discussed about this project",
        "Manging community",
        "Managing teams of Moderators, Event Coordinators",
        `Leading a company as a CEO, and as well technical aspect as CTO. 
         Initially I handled a lot as well financial and other needs and as 'One-man' army, 
         yet I've other members who does game testing, design, and such`,
        "Financial Bugdet allocation (The site was free, although maintaining it was expensive)",
        "Monitor Social Technology Trends",
        "Maintain high security standards & follow all required processes for keeping the player safe at all times",
        "Monitor, evaluate & keep up to date with the regulations",
        "Monitor Analytics",
        "Lead and motivate",
        "Innovate innovative features to build an truly amazing network for the users",
        "Making high-quality investing decisions",
        "Create strategy for improve the social network",
        "Maintain a deep knowledge of other possible competitors",
        "Analyze problematic situations and occurrences and provide solutions",
        "Furthermore can be discussed about this project",
      ],
      techStack: [
        "PHP",
        "My Own Frameworks (PHP, JS)",
        "JS (JQuery, Backbone)",
        "Python",
        "WebGL & Canvas",
        "HTML",
        "CSS",
        "Cloudflare",
        "DigitalOcean",
        "AWS",
      ],
      link: "https://drive.google.com/drive/folders/1jN-Xhfiro3UJppRLVehG8UIytjFJVVtl?usp=share_link",
      from: "Apr 2015",
      to: "Apr 2019",
    },
    {
      image: "/images/tastetravellers-cover.webp",
      title: "TasteTravellers",
      category: "Media",
      intro: `I am a comprehensive travel companion for those enchanted by the allure of exploration and adventure. 
      My presence spans across various digital platforms, each offering unique ways to engage with the travel experience.
      Facebook page, TasteTravellers - https://www.facebook.com/tastetravellersmt, 
      Facebook group, TasteTravellers - Travel the Globe - https://www.facebook.com/groups/911770150334644). 
      On Instagram, follow @tastestravellers - https://www.instagram.com/@tastestravellers
      TasteTravellers - https://www.youtube.com/@tastetravellers
      TasteTravellers Store, accessible at tastetravellers.store - https://www.tastetravellers.store).`,
      responsibilities: [
        "Content Creation and Curation",
        "Community Engagement",
        "Photography and Visual Storytelling",
        "Travel Blogging",
        "E-commerce Management",
        "Marketing and Promotion",
        "Audience Growth",
        "Quality Assurance",
        "Feedback Analysis",
        "Collaborations and Partnerships",
        "Travel Research and Planning",
        "Legal and Ethical Compliance",
        "Building the roadmap & Vision",
        "Advertising and Promoting travel-related companies partnered with us",
        "Advertise our content on a budget",
      ],
      techStack: ["Shopify"],
      link: "https://www.facebook.com/tastetravellersmt",
      from: "Feb 2018",
    },
    {
      image: "/images/chapter3.webp",
      title: "GOZ Chapter 3",
      category: "Marketing, Patch Intro, MMORPG",
      intro: `After the first two chapters, 
      I honed my marketing skills and introduced a landing page for the pre-release of the new chapter.`,
      responsibilities: [
        "Develop & Maintain an introductive site for acquire new players",
        "Monitor Analytics",
        "Marketing using various of Social Media's and their ads tools",
      ],
      techStack: ["ReactJS", "Static Site"],
      link: "https://chapter3.goz.fun",
      from: "Apr 2018",
      to: "Apr 2018",
    },
    {
      image: "/images/chapter4.webp",
      title: "GOZ Chapter 4",
      category: "Promoting the new Patch",
      intro: `After first 2 chapters, I started to improve my marketing skills
       and therefore introduced landing page for the pre-release of the new chapter.`,
      responsibilities: [
        "Develop & Maintain an introductive site for acquire new players",
        "Monitor Analytics",
        "Marketing using various of Social Media's and their ads tools",
      ],
      techStack: ["ReactJS", "Static Site"],
      link: "https://chapter4.goz.fun",
      from: "Apr 2019",
      to: "Apr 2019",
    },
    {
      image: "/images/portfolio.webp",
      title: "My Portfolio",
      category: "Self-Promotion",
      intro:
        "An interactive portfolio to learn further about myself & what I can offer. Interested? Reach out!",
      responsibilities: [
        "Develop & Maintain an introductive site",
        "Monitor Analytics",
        "Make sure high performance is in place",
        "Handle clients",
      ],
      techStack: [
        "NextJS",
        "React",
        "Styled Components",
        "Tailwind",
        "Fontawesome",
        "Recoil",
        "Static Site",
      ],
      link: "https://redgame.dev",
      from: "Nov 2022",
      to: "Nov 2022",
    },
    {
      image: "/images/otherprojects.webp",
      title: "Other Projects",
      category: "Different industries",
      intro: `Generally made many more projects, which I try my best to 
      keep my knowledge active and acquire more, therefore could introduce valuable knowledge to companies I work for.`,
      responsibilities: [
        "Architecting the whole solution from scratch",
        "Acquire knowledge and improve overtime",
      ],
      techStack: [
        "ReactJS",
        "Unity",
        "Angular",
        "C/C++",
        "PHP",
        "NodeJS",
        "Flutter",
        "Python",
      ],
      link: "https://drive.google.com/drive/folders/0B1gPxpJpFGW5SGhXeS1pTzA4Tmc?resourcekey=0-amvzxbZpCBhf7bV-GVUmTg&usp=share_link",
      from: "Jan 2013",
      to: "Jan 2022",
    },
  ],
  socialMedia: {
    byUsername: {
      twitter: "@red_game_dev",
      instagram: "adventure.redmt",
      facebook: "traveller.redmt",
      linkedIn: "redeemer-pace-685692b9",
    },
    byProjectsUsername: {
      gameYt: "@godsofzushin",
    },
  },
};
