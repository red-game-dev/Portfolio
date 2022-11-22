import { Detail } from "@/types/details";
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
  intro: "Hello! I’m <strong>Redeemer Pace</strong>, lets get to know me?",
  cover: "/images/cover-picture.jpg",
  cv: "https://drive.google.com/file/d/1k2FJG0ZpKA76eCUg_mb1TlncqzOLsACg/view?usp=sharing",
  typingsTitles: [
    "Your next <strong>Frontend Engineer</strong>",
    "Your next <strong>Backend Engineer</strong>",
    "Your next <strong>Game Developer</strong>",
    "Your next <strong>App Developer</strong>",
    "Your next <strong>Software Engineer</strong>",
    "Your next <strong>Tech Consultant</strong>",
    "Your next <strong>Architect</strong>",
  ],
  sections: {
    services: {
      title: "Services",
      description: ["Looking for top-notch service? You're at the right place!"]
    },
    design: {
      title: "Design Skills",
      description: ["Design perhaps not my main expertise, yet I handled a lot of designs throughout my experience"]
    },
    language: {
      title: "Language Skills",
      description: ["Most of the time I do communicate more using english, sometimes more than my mother tongue"]
    },
    tech: {
      title: "Tech Skills",
      description: ["Have an overview of my expertise in tech, is there any skills that interest you?"]
    },
    tools: {
      title: "Tools Skills",
      description: ["Generally I do use a lot of tools, although some may use less and some may use more according to the occasion of current work"]
    },
    expertise: {
      title: "Expertise",
      description: ["Various of roles I do expertise at, each one will give you an overview of knowledge overall"]
    },
    projects: {
      title: "Projects",
      description: ["Lets speak about projects, have a small overview of few huge projects!"]
    },
    conclusion: {
      title: "Wow!",
      description: [`
        You made it till the end, how was it the journey about me? Should you require to reach out to me, 
        ideally would be after 4.30 PM CET (Malta) business days. 
        I look forward for to our conversation near the future conversation!
      `]
    }
  },
  details: {
    name: "Redeemer Pace",
    description: `Highly experienced as Software Engineer, Game Development, Web Development, Tech Consultancy, Architecture, Managing, 
    Marketing. Looking forward to learn more where I can I improve my knowledge & new challenges`,
    residence: "Maltese",
    jobType: "B2B / Employment",
    phone: "+356 79323059",
    email: "red.pace.dev@gmail.com",
    image: "/images/profile.png",
    contactTime: "After 4.30 PM CET (Malta) business days",
    isFlexible: true
  },
  services: [
    {
      title: "Frontend Enginering",
      icon: "fas fa-code",
      description: ""
    },
    {
      title: "Backend Enginering",
      icon: "fas fa-code",
      description: ""
    },
    {
      title: "Tech Consultancy",
      icon: "fas fa-code",
      description: ""
    },
    {
      title: "Game Consultancy",
      icon: "fas fa-code",
      description: ""
    },
    {
      title: "Business Consultancy",
      icon: "fas fa-code",
      description: ""
    },
    {
      title: "Marketing",
      icon: "fas fa-code",
      description: ""
    }
  ],
  experience: [
    {
      title: "Frontend Engineer, Chiliz",
      from: "Nov 2019",
      description: `Nativescript, Vuejs, Webpack, Jest tests, Redux-observables, RxJs, Java/Kotlin, 
      Swift, React-Native, React, Ionic, Flutter.`
    },
    {
      title: "Chief Techonology Officer, CoinOn",
      from: "Nov 2021",
      to: "Jan 2022",
      description: `Nativescript, Vuejs, Webpack, Jest tests, Redux-observables, 
      RxJs, Java/Kotlin, Swift, React-Native, React, Ionic, Flutter.`
    },
    {
      title: "Founder, CEO & CTO, Gods of Zushin",
      from: "Apr 2015",
      description: "C/C++, Lua, Python, VueJS, PHP Laravel, NodeJs, C#"
    },
    {
      title: "Software Developer, KPMG",
      from: "Feb 2019",
      to: "Sep 2019",
      description: "PHP - Laravel, VueJS, Angular, React, C# ASP.NET, C/C++"
    },
    {
      title: "Frontend Developer, AuthenticGaming",
      from: "Jul 2017",
      to: "Jan 2019",
      description: "React, Redux, Redux-observables, RxJs, Backbone, Canvas, NodeJS"
    }
  ],
  education: [
    {
      title: "Bachelor of Science (Honours) in Multimedia Software Development, MCAST",
      description: `Although last year wasnt completed, I was able to learn a lot of interesting subjects. \n 
      Coursework - C#, Blender, Game Development, Photoshop, Web Development, PHP, Maltese, English, Maths, 
      2D Animation with After Effects`,
      from: "Sep 2015",
      to: "Jun 2017"
    },
    {
      title: "Extended Diploma Computer Software Engineering, MCAST",
      description: "Coursework - C#, Blender, Photoshop, Web Development, PHP, Maltese, English, Maths, 2D Animation with After Effects",
      from: "Sep 2013",
      to: "Jun 2015"
    },
    {
      title: "Diploma Computer Software Engineering, MCAST",
      description: "Coursework - C#, Blender, Photoshop, Web Development, PHP, Maltese, English, Maths, 2D Animation with After Effects",
      from: "Sep 2011",
      to: "Jun 2013"
    }
  ],
  skills: {
    design: [
      {
        name: "Photoshop",
        score: 80
      },
      {
        name: "Illustrator",
        score: 60
      },
      {
        name: "Adobe XD",
        score: 40
      },
      {
        name: "Figma",
        score: 40
      },
      {
        name: "Blender",
        score: 60
      },
      {
        name: "Maya",
        score: 60
      }
    ],
    language: [
      {
        name: "Maltese",
        score: 100
      },
      {
        name: "English",
        score: 90
      },
      {
        name: "Italian",
        score: 70
      }
    ],
    tech: [
      {
        name: "Vue",
        score: 100
      },
      {
        name: "React",
        score: 90
      },
      {
        name: "Typescript",
        score: 90
      },
      {
        name: "NodeJS",
        score: 90
      },
      {
        name: "Flutter",
        score: 40
      },
      {
        name: "React-Native",
        score: 80
      },
      {
        name: "NativeScript",
        score: 90
      },
      {
        name: "C/C++",
        score: 90
      },
      {
        name: "Python",
        score: 85
      },
      {
        name: "Lua",
        score: 50
      },
      {
        name: "PHP",
        score: 90
      },
      {
        name: "MySQL",
        score: 100
      },
      {
        name: "NoSQL",
        score: 65
      },
      {
        name: "Angular",
        score: 40
      },
      {
        name: "HTML / CSS",
        score: 100
      },
      {
        name: "LESS / SASS",
        score: 75
      },
      {
        name: "Bash",
        score: 80
      },
      {
        name: "Electron",
        score: 30
      },
      {
        name: "Algorithms",
        score: 65
      }
    ],
    tools: [
      {
        name: "Git",
        score: 90
      },
      {
        name: "Unity",
        score: 65
      },
      {
        name: "Unreal Engine",
        score: 45
      },
      {
        name: "Sky Engine",
        score: 5
      },
      {
        name: "VS Code",
        score: 90
      },
      {
        name: "JetBeans Tools",
        score: 70
      },
      {
        name: "Android Studo",
        score: 50
      },
      {
        name: "XCode",
        score: 20
      }
    ],
    expertise: [
      {
        name: "Frontend Engineer",
        score: 100
      },
      {
        name: "Backend Engineer",
        score: 75
      },
      {
        name: "Game Engineer",
        score: 80
      },
      {
        name: "Tech Consultancy",
        score: 75
      },
      {
        name: "Architecture",
        score: 80
      },
      {
        name: "Marketing",
        score: 50
      },
      {
        name: "Enterpreneur",
        score: 75
      },
      {
        name: "Manging",
        score: 70
      },
      {
        name: "Designing",
        score: 40
      }
    ]
  },
  projects: [
    {
      image: "/images/chapter5-cover.jpg",
      title: "Gods of Zushin",
      category: "Game | MMORPG",
      intro: `An achievement on it's own and personally is part of my work experience as well, 
      since during the weekends I do aim to work on interesting game updates which does grow my knowledge significantly. 
      Please be sure to check under "Work Experience" to learn further about the project details.`,
      responsabilities: [],
      techStack: [""],
      link: "https://goz.fun",
      from: "Apr 2015"
    },
    {
      image: "/images/socialnetwork-amw.png",
      title: "AMW - Social Network & Game",
      category: "Social Network, Game",
      intro: `Although this project was discontinued, I did manage back then to raise a 
      huge community related to Anime, Manga, Cosplay, Gaming. `,
      responsabilities: [
        "This was a social network similar to Facebook & google plus",
        "A small enjoyable game as part of the network, that when you interact you would earn points to build your customized character. ",
        `Each character could be customized any way you would like it to be, 
        while no limits were added such as for levels, enchancements and so on.`,
        `Included various of features such as auction, ads system similar to facebook, 
        character interaction as RPG, publish your own creations, chats and more`,
        "Furthermore can be discussed about this project"
      ],
      techStack: ["PHP", "JS", "HTML", "Python", "WebGL & Canvas"],
      link: "https://drive.google.com/drive/folders/1jN-Xhfiro3UJppRLVehG8UIytjFJVVtl?usp=share_link",
      from: "Apr 2015",
      to: "Apr 2019"
    },
    {
      image: "/images/chapter3.jpg",
      title: "GOZ Chapter 3",
      category: "Marketing, Patch Intro, MMORPG",
      intro: `After first 2 chapters, I started to improve my marketing skills and 
      therefore introduced landing page for the pre-release of the new chapter.`,
      responsabilities: [],
      techStack: ["ReactJS"],
      link: "https://chapter3.goz.fun",
      from: "Apr 2018",
      to: "Apr 2018"
    },
    {
      image: "/images/chapter4.jpg",
      title: "GOZ Chapter 4",
      category: "Promoting the new Patch",
      intro: `After first 2 chapters, I started to improve my marketing skills
       and therefore introduced landing page for the pre-release of the new chapter.`,
      responsabilities: [],
      techStack: ["ReactJS"],
      link: "https://chapter4.goz.fun",
      from: "Apr 2019",
      to: "Apr 2019"
    },
    {
      image: "/images/otherprojects.png",
      title: "Other Projects",
      category: "Different industries",
      intro: `Generally made many more projects, which I try my best to 
      keep my knowledge active and acquire more, therefore could introduce valuable knowledge to companies I work for.`,
      responsabilities: [],
      techStack: ["ReactJS", "Unity", "Angular", "C/C++"],
      link: "https://drive.google.com/drive/folders/0B1gPxpJpFGW5SGhXeS1pTzA4Tmc?resourcekey=0-amvzxbZpCBhf7bV-GVUmTg&usp=share_link",
      from: "Jan 2013",
      to: "Jan 2022"
    }
  ],
  socialMedia: {
    byUsername: {
      twitter: "@red_game_dev",
      instagram: "adventure.redmt",
      facebook: "traveller.redmt",
      linkedIn: "redeemer-pace-685692b9"
    },
    byProjectsUsername: {
      gameYt: "@godsofzushin"
    }
  }
};
