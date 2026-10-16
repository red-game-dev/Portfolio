import { FC, ReactNode } from "react";

import type { SectionThemeId } from "@/config/sectionThemes";

interface ThemeProps {
  theme: SectionThemeId;
  children: ReactNode;
}

// A section with a subject of its own inside its zone's run: its own accent (globals.css) and, where its content
// switches, its own switch effect (`themeOf` in SwitchStage). Like Zone, it draws no box of its own.
export const Theme: FC<ThemeProps> = ({ theme, children }) => (
  <div data-theme={theme} style={{ display: "contents" }}>
    {children}
  </div>
);
