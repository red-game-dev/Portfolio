import { ASK_SOURCES, AskSourceKey } from "@/config/ask";
import { PortfolioData } from "@/data/resume";
import { formatPeriod } from "@/packages/insights/career";
import { collapseWhitespace } from "@/packages/text/format";
import { aiUsageService } from "@/services/ai-usage";
import { createForgeStations } from "@/services/skills";
import { Resume } from "@/types/resume";

const PERIOD = "{from} to {to}";
const PRESENT = "now";

const clean = (text: string) => collapseWhitespace(text);

const lines = (items: Array<string | false | 0 | undefined>) => items.filter((item): item is string => Boolean(item)).map(clean);

const entry = (role: Resume) => lines([
  `## ${role.title} (${formatPeriod(role, PERIOD, PRESENT)})`,
  role.isVenture && `Founded or co-founded by Red${role.ventureRole ? `, as ${role.ventureRole}` : ""}.`,
  ...role.description,
  ...(role.bullets ?? []).map((bullet) => `- ${bullet}`),
  role.outcome && `Outcome: ${role.outcome}`,
  role.productOutcome && `As a product: ${role.productOutcome}`,
  role.techStack?.length && `Stack: ${role.techStack.join(", ")}`,
]);

type SectionBuilder = (data: PortfolioData) => string[];

// Each source the agent may cite, written from the same data the page renders. Nothing here is typed twice:
// a change to the site is a change to what the agent knows.
const SECTIONS: Record<AskSourceKey, { title: string; build: SectionBuilder }> = {
  about: {
    title: "About Red",
    build: ({ details, headline, cvDocument, socialMedia }) => lines([
      `Name: ${details.name}, known as Red.`,
      ...headline.lines,
      headline.availability,
      details.hook,
      ...details.paragraphs,
      ...details.proof.map((figure) => `Figure: ${figure.value} ${figure.label}`),
      ...details.facts.map((fact) => `Fact: ${fact}`),
      `Works: ${details.location}`,
      `Job type: ${details.jobType}`,
      `Best time to reach him: ${details.contactTime}`,
      `Email: ${details.email}`,
      `LinkedIn: https://www.linkedin.com/in/${socialMedia.byUsername.linkedIn}`,
      `CV headline: ${cvDocument.headline}`,
      ...cvDocument.summary,
      ...cvDocument.highlights.map((highlight) => `Highlight: ${highlight}`),
      `Languages: ${cvDocument.languages}`,
    ]),
  },
  services: {
    title: "What Red offers",
    build: ({ serviceGroups }) => serviceGroups.flatMap((group) => [
      `## ${group.label}`,
      ...group.services.flatMap((service) => lines([`${service.title}: ${service.description}`, ...(service.points ?? []).map((point) => `- ${point}`)])),
    ]),
  },
  history: {
    title: "Work history and education, newest first",
    build: ({ experience, education }) => [...experience, ...education].flatMap(entry),
  },
  aiUsage: {
    title: "How Red builds with AI",
    build: () => {
      const view = aiUsageService.getView();

      return lines([
        ...view.intro.description,
        ...view.agents.description,
        ...view.agents.stages.flatMap((stage) => stage.principles.map((principle) => `${stage.name}, ${principle.title}: ${principle.description}`)),
        ...view.timeline.milestones.map((milestone) => `${milestone.period}, ${milestone.title}: ${milestone.description}`),
        ...view.budget.figures.map((figure) => `Figure: ${figure.value} ${figure.label}`),
        ...view.mix.tasks.map((task) => `AI task: ${task.name}, ${task.label}`),
      ]);
    },
  },
  forge: {
    title: "Skills with years of real use, counted from the roles and projects that used them",
    build: (data) => createForgeStations(data).map((station) => {
      const tracked = station.items
        .filter((item) => item.isTracked)
        .map((item) => `${item.name} ${item.years > 0 ? `${item.years}y` : "under 1y"}`);

      return clean(`${station.title}: ${tracked.join(", ")}`);
    }),
  },
  skillAreas: {
    title: "Skills by area",
    build: ({ skillAreas }) => skillAreas.map((area) => clean(`${area.label}: ${area.items.join(", ")}`)),
  },
  caseStudies: {
    title: "Case studies: hard problems and how they were solved",
    build: ({ caseStudies }) => caseStudies.flatMap((caseStudy) => lines([
      `## ${caseStudy.title} (${caseStudy.area})`,
      ...caseStudy.summary,
      ...caseStudy.points.map((point) => `- ${point}`),
      `Lesson: ${caseStudy.loot}`,
    ])),
  },
  projects: {
    title: "Projects and ventures",
    build: ({ projects, projectMap }) => projects.flatMap((project) => lines([
      `## ${project.title} (${project.category}, ${projectMap.statuses[project.status]}, ${formatPeriod(project, PERIOD, PRESENT)})`,
      project.intro,
      ...project.responsibilities.map((item) => `- ${item}`),
      `Stack: ${project.techStack.join(", ")}`,
      project.link && `Link: ${project.link}`,
      project.deepDive?.note,
    ])),
  },
  recommendations: {
    title: "What people who worked with Red say",
    build: ({ recommendations }) => recommendations.map((item) => clean(`"${item.quote}" (${item.role}, ${item.company}, ${item.date})`)),
  },
};

// The whole site as plain text, one block per source, each headed with the key an answer cites it by.
export const createAskKnowledge = (data: PortfolioData): string => ASK_SOURCES
  .map((key) => [`# ${SECTIONS[key].title} [key: ${key}]`, ...SECTIONS[key].build(data)].join("\n"))
  .join("\n\n");
