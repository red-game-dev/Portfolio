// The two page CV for applied AI and forward deployed roles. Titles, dates, figures and skill years are read
// from the rest of the content, so the CV and the site can never disagree; only the wording is chosen here.
export interface CvRole {
  // The title of an entry in experience, exactly as written there.
  title: string;
  bullets: string[];
}

export interface CvSkillLine {
  label: string;
  // Skills as the forge names them; each shows its years of use.
  names: string[];
}

export interface CvDocument {
  headline: string;
  summary: string[];
  highlightsLabel: string;
  highlights: string[];
  experienceLabel: string;
  roles: CvRole[];
  // Under the roles: the ventures not listed one by one.
  moreVentures: string;
  skillsLabel: string;
  skills: CvSkillLine[];
  educationLabel: string;
  education: string[];
  languagesLabel: string;
  languages: string;
  // "{years}" is replaced with a skill's years.
  yearsFormat: string;
  printLabel: string;
}
