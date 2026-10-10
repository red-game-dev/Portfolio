// Types for rules.mjs, so TypeScript callers (the content rules test) use it strictly.
export declare const DENYLIST_PATH: string;

export declare const readDenylist: (root: string) => string[];

export declare const findViolations: (text: string, denylist?: readonly string[]) => string[];

export declare const isContentFile: (path: string, root?: string) => boolean;

export declare const isEnvFile: (path: string) => boolean;

export declare const SAFE_ENV_NAMES: readonly string[];

export declare const findSecrets: (text: string) => string[];
