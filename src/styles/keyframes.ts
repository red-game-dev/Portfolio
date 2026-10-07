import { keyframes } from "styled-components";

// A text caret: on, then off, in steps.
export const caretBlink = keyframes`
  50% { opacity: 0; }
`;

export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
