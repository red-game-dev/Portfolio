// Profile links, built from the usernames in the content.
export const SOCIAL_URLS = {
  linkedIn: (username: string) => `https://www.linkedin.com/in/${username}`,
  facebook: (username: string) => `https://www.facebook.com/${username}`,
  instagram: (username: string) => `https://www.instagram.com/${username}`,
  twitter: (username: string) => `https://twitter.com/${username}`,
  youtube: (channel: string) => `https://www.youtube.com/${channel}`,
} as const;
