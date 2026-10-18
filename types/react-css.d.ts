import "react";

// A style may set custom properties for its own CSS to read (`--i`, `--accent`, `--nav-progress`), so a style object
// that does needs no assertion.
declare module "react" {
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined;
  }
}
