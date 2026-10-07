import { portfolioData } from "@/data/resume";
import { aiUsageService } from "@/services/ai-usage";
import { PortfolioAiUsageSource } from "@/services/ai-usage/PortfolioAiUsageSource";

const EM_DASH = String.fromCharCode(0x2014);

// Guards the published content itself: if an edit to resume.ts breaks the breakdown, this fails before
// the build does.
describe("portfolio AI usage content", () => {
  test("passes the shape guard, the rules and the mapper", () => {
    expect(() => aiUsageService.getView()).not.toThrow();
  });

  test("every published count label is a true floor of its measured count", () => {
    aiUsageService.getView().mix.tasks.forEach((task) => {
      expect(Number(task.label.replace(/[^0-9]/g, ""))).toBeLessThanOrEqual(task.count);
    });
  });

  test("the source joins the section intro with the section content", () => {
    expect(new PortfolioAiUsageSource().read()).toEqual(expect.objectContaining({
      intro: portfolioData.sections.aiUsage,
      mix: portfolioData.aiUsage.mix,
    }));
  });

  test("the screen lines are short enough to assemble on a phone", () => {
    portfolioData.aiUsage.screen.message.forEach((line) => expect(line.length).toBeLessThanOrEqual(20));
  });

  test("no copy uses an em dash", () => {
    expect(JSON.stringify({ intro: portfolioData.sections.aiUsage, ...portfolioData.aiUsage })).not.toContain(EM_DASH);
  });
});
