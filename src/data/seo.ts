import { portfolioData }  from "@/data/resume";
import { Detail as ProfileDetails } from "@/types/details";
import { ProjectDetail } from "@/types/projects";
import { Skill } from "@/types/skills";

interface Details {
  title: string;
  titleTemplate: string;
  description: string;
  details: ProfileDetails;
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

const seoDetails: Details = {
  title: "Portfoilio",
  details: portfolioData.details,
  titleTemplate: `%s | ${portfolioData.details.name}`,
  description: `
    Let's get to know me! Expertise in Frontend Engineering,
    Backend Engineering, Game Development, Architect, Game Consultancy, Tech Consuultancy, Buisness Consultancy, Manging & Marketing
  `,
  socialMedia: portfolioData.socialMedia,
  skills: portfolioData.skills,
  projects: portfolioData.projects,
};

export default seoDetails;
