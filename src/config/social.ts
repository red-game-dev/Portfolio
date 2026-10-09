// Profile links, built from the usernames in the content.
export const SOCIAL_URLS = {
  linkedIn: (username: string) => `https://www.linkedin.com/in/${username}`,
  facebook: (username: string) => `https://www.facebook.com/${username}`,
  instagram: (username: string) => `https://www.instagram.com/${username}`,
  // The content keeps the handle as people write it, with its @, which a profile URL must not carry.
  twitter: (username: string) => `https://x.com/${username.replace(/^@/, "")}`,
  youtube: (channel: string) => `https://www.youtube.com/${channel}`,
} as const;
