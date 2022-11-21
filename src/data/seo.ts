import { portfolioData }  from "@/data/resume";

interface Details {
  title: string;
  titleTemplate: string;
  description: string;
}

const seoDetails: Details = {
  title: "Portfoilio",
  titleTemplate: `%s | ${portfolioData.details.name}`,
  description: `
    Let's get to know me! Expertise in Frontend Engineering,
    Backend Engineering, Game Development, Architect, Game Consultancy, Tech Consuultancy, Buisness Consultancy, Manging & Marketing
  `,
};

export default seoDetails;
