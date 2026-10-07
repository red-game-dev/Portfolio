import { AUDIENCE_ANCHORS, SECTION_IDS } from "@/config/sections";
import { activityStats } from "@/packages/insights/activity";
import { startYear } from "@/packages/insights/career";
import { Command, error, heading, output, system } from "@/packages/interaction/terminal";
import { collapseWhitespace, fill } from "@/packages/text/format";
import { CommandContext, GROUPS } from "@/services/terminal/commands/shared";
import { Audience } from "@/types/case-studies";

// A short, stable commit hash for a role, so git log reads like the real thing.
const HASH_SPACE = 16 ** 7;

const shortHash = (text: string) => Array.from(text)
  .reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) % HASH_SPACE, 7)
  .toString(16)
  .padStart(7, "0");

// See the work.
export const createWorkCommands = (context: CommandContext): Command[] => {
  const { data, experience, rankedSkills } = context;

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
    {
      name: "stack",
      group: GROUPS.work,
      aliases: ["top"],
      usage: "stack [count]",
      summary: "The skills I have used longest, from the work itself",
      run: ([count]) => {
        const shown = rankedSkills().slice(0, Math.min(40, Math.max(1, Number(count) || 12)));

        return {
          lines: [
            heading("Most used, by years in real roles and projects"),
            ...shown.map((skill) => output(`  ${skill.name.padEnd(26)}${`${skill.years}+ years`.padEnd(12)}${skill.rarity}`)),
            system("goto skills for every station"),
          ],
        };
      },
    },
    {
      name: "streak",
      group: GROUPS.work,
      aliases: ["activity"],
      summary: "My GitHub activity streaks",
      run: () => {
        const stats = activityStats(data.codeReview.activity.years);
        const { achievements } = data.codeReview;
        const busiest = stats.busiestMonth;

        return {
          lines: [
            heading(data.codeReview.activityTitle),
            output(`  ${fill(achievements.dayStreak, { n: stats.longestDayStreak })}`),
            output(`  ${fill(achievements.weekStreak, { n: stats.longestWeekStreak })}`),
            output(`  ${fill(achievements.activeDays, { n: stats.activeDays })}`),
            ...(stats.perfectWeeks > 0 ? [output(`  ${fill(achievements.perfectWeeks, { n: stats.perfectWeeks })}`)] : []),
            ...(busiest ? [output(`  ${fill(achievements.busiestMonth, { month: achievements.months[busiest.month], year: busiest.year })}`)] : []),
            system("goto review for the calendar"),
          ],
        };
      },
    },
    {
      name: "git",
      group: GROUPS.work,
      usage: "git <log|branch|status|checkout>",
      summary: "My career as a repository",
      run: ([subcommand, ...args]) => {
        const { historyLabels } = data;
        const ventures = experience.filter((entry) => entry.isVenture);
        const branches = [historyLabels.workBranch, historyLabels.foundedBranch];

        if (subcommand === "log") {
          return {
            lines: experience.slice(0, Math.max(1, Number(args[0]) || experience.length)).map((entry) => output(
              `* ${shortHash(entry.title)} ${String(startYear(entry.from)).padEnd(5)}${entry.isVenture ? `(${historyLabels.foundedBranch}) ` : ""}${entry.title}`,
            )),
          };
        }

        if (subcommand === "branch") {
          const founded = Math.max(data.foundedTotal, ventures.length);

          return {
            lines: [
              output(`* ${historyLabels.workBranch.padEnd(10)}${experience.length - ventures.length} commits`),
              output(`  ${historyLabels.foundedBranch.padEnd(10)}${founded} commits, ${founded - ventures.length} of them not listed one by one`),
            ],
          };
        }

        if (subcommand === "status") {
          return {
            lines: [output(`On branch ${historyLabels.workBranch}`), output(data.headline.availability), system("nothing to commit, ready for the next one")],
          };
        }

        if (subcommand === "checkout") {
          const branch = args[0]?.toLowerCase() ?? "";

          return branches.includes(branch)
            ? { lines: [system(fill(historyLabels.switched, { branch }))], effect: { type: "navigate", target: SECTION_IDS.history } }
            : { lines: [error(`error: pathspec '${args[0] ?? ""}' did not match any branch. Try git branch.`)] };
        }

        return { lines: [system("usage: git log [count] | git branch | git status | git checkout <branch>"), system("github opens the real one")] };
      },
    },
  ];
};
