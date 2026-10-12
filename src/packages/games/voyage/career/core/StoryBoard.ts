import { newStory, STORY } from "../config/story";
import { CareerEvent, StoryChapter, StoryProgress, StoryStepDone, StoryView } from "../domain/career";
import { advance, targetOf } from "./MissionBoard";

// What came of something happening in the story: the steps it finished, and the chapter if it finished one.
export interface StoryOutcome {
  story: StoryProgress;
  done: StoryStepDone[];
  chapter: StoryChapter | null;
}

// A story as kept, made to fit the chapters this code knows: none kept starts it, a chapter past the last is the
// story told, and each step's progress is a whole count no higher than it takes.
export const cleanStory = (story: StoryProgress | undefined): StoryProgress => {
  if (!story) {
    return newStory();
  }

  const chapter = Math.min(STORY.length, Math.max(0, Math.floor(story.chapter)));
  const steps = STORY[chapter]?.steps ?? [];

  return { chapter, progress: steps.map((step, index) => Math.min(targetOf(step.goal), Math.max(0, Math.floor(story.progress[index] ?? 0)))) };
};

// Whether a step counts yet: the first always, the rest once the first is done.
const isOpen = (chapter: StoryChapter, progress: readonly number[], index: number): boolean =>
  index === 0 || progress[0] >= targetOf(chapter.steps[0].goal);

// Counts something that happened against the chapter under way. A chapter whose steps are all done gives way to
// the next, whose steps start from nothing: what finished one chapter never counts for the next.
export const advanceStory = (story: StoryProgress, event: CareerEvent): StoryOutcome => {
  const chapter = STORY[story.chapter];

  if (!chapter) {
    return { story, done: [], chapter: null };
  }

  const done: StoryStepDone[] = [];
  const progress = chapter.steps.map((step, index) => {
    const before = story.progress[index];
    const target = targetOf(step.goal);

    if (before >= target || !isOpen(chapter, story.progress, index)) {
      return before;
    }

    const after = Math.min(target, advance(step.goal, before, event));

    if (after >= target) {
      done.push({ step, chapter, xp: step.xp, coin: step.coin });
    }

    return after;
  });
  const isTold = chapter.steps.every((step, index) => progress[index] >= targetOf(step.goal));

  if (isTold) {
    const next = story.chapter + 1;

    return { story: { chapter: next, progress: STORY[next]?.steps.map(() => 0) ?? [] }, done, chapter };
  }

  return { story: { chapter: story.chapter, progress }, done, chapter: null };
};

// The chapter under way and each of its steps, for the UI.
export const storyView = (story: StoryProgress): StoryView => {
  const chapter = STORY[story.chapter] ?? null;

  return {
    chapter,
    index: story.chapter,
    total: STORY.length,
    steps: chapter
      ? chapter.steps.map((step, index) => ({ step, progress: story.progress[index], target: targetOf(step.goal), isOpen: isOpen(chapter, story.progress, index) }))
      : [],
  };
};
