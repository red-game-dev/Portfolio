import { AUDIENCE_ANCHORS, SECTION_IDS } from "@/config/sections";
import { Command, heading, output, system } from "@/packages/interaction/terminal";
import { collapseWhitespace } from "@/packages/text/format";
import { CommandContext, GROUPS } from "@/services/terminal/commands/shared";
import { Audience } from "@/types/case-studies";

// See the work.
export const createWorkCommands = (context: CommandContext): Command[] => {
  const { data } = context;

  return [
    {
      name: "services",
      group: GROUPS.work,
      aliases: ["offer"],
      summary: "What I can take on",
      run: () => ({
        lines: data.serviceGroups.flatMap((group) => [heading(group.label), ...group.services.map((service) => output(`  ${service.title}`))]),
      }),
    },
    {
      name: "ai",
      group: GROUPS.work,
      summary: "How I use AI, in numbers",
      run: () => {
        const tasks = [...data.aiUsage.mix.tasks].sort((first, second) => second.count - first.count);

        return {
          lines: [
            heading(data.aiUsage.mix.title),
            output(data.aiUsage.mix.description[0] ?? ""),
            ...tasks.slice(0, 4).map((task) => output(`  ${task.name.padEnd(42)}${Math.floor(task.count / 50) * 50}+`)),
            output(`Stages every change goes through: ${data.aiUsage.agents.stages.map((stage) => stage.name).join(", ")}`),
            system("goto ai for the full section"),
          ],
        };
      },
    },
    {
      name: "cases",
      group: GROUPS.work,
      aliases: ["case-studies"],
      usage: "cases [payments|ai|architecture]",
      summary: "Case studies, optionally for one kind of role",
      run: ([audience]) => {
        const filter = (Object.keys(AUDIENCE_ANCHORS) as Audience[]).find((key) => key === audience?.toLowerCase());
        const list = filter ? data.caseStudies.filter((item) => item.audiences.includes(filter)) : data.caseStudies;

        return {
          lines: [heading("Case studies"), ...list.map((item) => output(`  ${item.title}`))],
          // A filtered view is a hash link, so the case studies section applies the same filter.
          effect: filter ? { type: "navigate", target: AUDIENCE_ANCHORS[filter] } : undefined,
        };
      },
    },
    {
      name: "projects",
      group: GROUPS.work,
      aliases: ["quests"],
      summary: "Projects and achievements",
      run: () => ({
        lines: [heading("Projects"), ...data.projects.map((project) => output(`  ${project.title.padEnd(32)}${project.category}`))],
      }),
    },
    {
      name: "references",
      group: GROUPS.work,
      aliases: ["testimonials"],
      summary: "What people I worked with say",
      run: () => ({
        lines: [
          heading("References"),
          ...data.recommendations.map((recommendation) => output(`  "${collapseWhitespace(recommendation.quote)}" ${recommendation.role}, ${recommendation.company}`)),
        ],
      }),
    },
    {
      name: "play",
      group: GROUPS.work,
      aliases: ["game"],
      summary: "Play Bug Raid",
      run: () => ({ lines: [system("Loading Bug Raid...")], effect: { type: "navigate", target: SECTION_IDS.arena } }),
    },
  ];
};
