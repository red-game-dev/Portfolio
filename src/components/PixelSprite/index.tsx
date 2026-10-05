import { FC, useMemo } from "react";

import { SpriteArt } from "@/config/sprites";
import { spriteSize, toPixelPaths } from "@/packages/graphics/pixel-art";

interface PixelSpriteProps extends SpriteArt {
  className?: string;
}

// Crisp pixel art at any size: one SVG path per colour, scaled without smoothing.
export const PixelSprite: FC<PixelSpriteProps> = ({ rows, palette, className }: PixelSpriteProps) => {
  const paths = useMemo(() => toPixelPaths(rows, palette), [rows, palette]);
  const { width, height } = spriteSize(rows);

  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {paths.map((path) => (
        <path key={path.color} d={path.d} fill={path.color} />
      ))}
    </svg>
  );
};
