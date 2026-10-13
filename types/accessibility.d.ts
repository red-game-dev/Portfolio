// The accessibility statement: what the site aims for, what is done, what is known not to meet it yet, how it is
// tested, how to report a problem ("{email}" is replaced), and when it was last reviewed. `link` is the line at the
// foot of the page that leads to it, `back` the way home from it.
export interface AccessibilityContent {
  title: string;
  description: string;
  intro: string;
  standard: string;
  status: string;
  doneTitle: string;
  done: string[];
  limitsTitle: string;
  limits: string[];
  // The settings a reader may want here (motion and the single key shortcuts), and a note on where they are kept.
  settingsTitle: string;
  settingsNote: string;
  testingTitle: string;
  testing: string;
  reportTitle: string;
  report: string;
  reviewed: string;
  back: string;
  link: string;
}
