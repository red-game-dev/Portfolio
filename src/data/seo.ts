import { portfolioData }  from "@/data/resume";

interface Details {
  title: string;
  titleTemplate: string;
  description: string;
}

const seoDetails: Details = {
  title: "Portfolio",
  titleTemplate: `%s | ${portfolioData.details.name}`,
  description: `
    Let's get to know each other! I have expertise in Frontend Engineering,
    Backend Engineering, Game Development, Architecture, Game Consultancy, Tech Consultancy, Business Consultancy, Management, and Marketing.
  `,
};

export default seoDetails;
