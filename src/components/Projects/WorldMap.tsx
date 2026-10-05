import { CSSProperties, FC, useMemo, useRef, useState } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { KIND_COLOURS, TERRAIN_ICONS } from "@/components/Projects/config";
import { useMapColumns } from "@/components/Projects/hooks/useMapColumns";
import useInView from "@/hooks/useInView";
import { createHexGrid, HEX_HEIGHT, HexCell, HexGrid, hexCentre, rowsFor, snakePath } from "@/packages/math/hex-grid";
import { ProjectDetail, ProjectKind } from "@/types/projects";

interface WorldMapProps {
  projects: ProjectDetail[];
  activeKind: ProjectKind | null;
  describe: (project: ProjectDetail) => string;
  hint: string;
  onOpen: (index: number) => void;
}

const HEX = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";

const pulse = keyframes`
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.35); }
`;

const cellKey = ({ column, row }: HexCell) => `${column}:${row}`;

const place = (cell: HexCell, grid: HexGrid): CSSProperties => ({
  left: `${(cell.x / grid.width) * 100}%`,
  top: `${(cell.y / grid.height) * 100}%`,
  width: `${100 / grid.width}%`,
  height: `${(HEX_HEIGHT / grid.height) * 100}%`,
});

const yearOf = (date: string) => date.split(" ").pop() ?? date;

const Board = tw.div`relative w-full`;

const Route = styled.svg(({ isDrawn }: { isDrawn: boolean }) => [
  tw`absolute inset-0 w-full h-full pointer-events-none z-[2]`,
  css`
    & .trail {
      stroke-dasharray: 1;
      stroke-dashoffset: ${isDrawn ? 0 : 1};
      transition: stroke-dashoffset 2.6s ease-in-out 0.3s;
    }

    @media (prefers-reduced-motion: reduce) {
      & .trail {
        stroke-dashoffset: 0;
        transition: none;
      }
    }
  `,
]);

const Terrain = styled.div(() => [
  tw`absolute flex items-center justify-center text-[#2a2a2a] bg-[#121212]`,
  css`
    clip-path: ${HEX};
    transform: scale(0.9);
    font-size: clamp(12px, 1.8vw, 22px);
  `,
]);

// A region: a hexagon in its kind's colour, which lifts and brightens when hovered or focused.
const Region = styled.button(({ isDim, isCurrent }: { isDim: boolean; isCurrent: boolean }) => [
  tw`absolute z-[3] p-0 m-0 border-0 cursor-pointer`,
  css`
    clip-path: ${HEX};
    background: var(--kind);
    transform: scale(0.9);
    transition: transform 0.25s ease, opacity 0.3s ease, background-color 0.2s ease;

    &:hover,
    &:focus-visible {
      outline: none;
      transform: scale(0.98);
    }

    &:focus-visible {
      background: #ffffff;
    }

    & > span {
      clip-path: ${HEX};
      background: color-mix(in srgb, var(--kind) 16%, #0d0d0d);
      transition: background-color 0.25s ease;
    }

    &:hover > span,
    &:focus-visible > span {
      background: color-mix(in srgb, var(--kind) 30%, #0d0d0d);
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `,
  isCurrent && css`
    animation: ${pulse} 2.4s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,
  isDim && tw`opacity-20`,
]);

const RegionFace = tw.span`absolute inset-[3px] flex flex-col items-center justify-center gap-[3px] text-[var(--kind)]`;

const RegionIcon = styled.span(() => [
  css`
    font-size: clamp(14px, 2.4vw, 28px);
    line-height: 1;
  `,
]);

const RegionYear = tw.span`text-[10px] md:text-xs font-semibold leading-none text-[#ddd]`;

const Info = tw.p`m-0 mt-[14px] min-h-[1.5em] text-sm text-[#bbb] text-center`;

// Every project as a region on a hex map, joined by the route I took through them in time order. Terrain
// fills the gaps so the board reads as a map rather than a grid of cards.
export const WorldMap: FC<WorldMapProps> = ({ projects, activeKind, describe, hint, onOpen }: WorldMapProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const isDrawn = useInView(boardRef, { threshold: 0.3 });
  const columns = useMapColumns();
  const [hovered, setHovered] = useState<number | null>(null);

  const { grid, regions, terrain } = useMemo(() => {
    const rows = rowsFor(projects.length, columns, 1);
    const board = createHexGrid(columns, rows);
    // One terrain tile per row, at a column that moves along, so the route bends around features.
    const path = snakePath(board, (cell) => cell.column === (cell.row * 2 + 1) % columns);
    const placed = projects.map((project, index) => ({ project, index, cell: path[index] }));
    const taken = new Set(placed.map(({ cell }) => cellKey(cell)));

    return { grid: board, regions: placed, terrain: board.cells.filter((cell) => !taken.has(cellKey(cell))) };
  }, [columns, projects]);

  const route = regions.map(({ cell }) => {
    const { x, y } = hexCentre(cell);

    return `${x},${y}`;
  }).join(" ");

  return (
    <div>
      <Board ref={boardRef} style={{ aspectRatio: `${grid.width} / ${grid.height}` }}>
        {terrain.map((cell, index) => (
          <Terrain key={cellKey(cell)} style={place(cell, grid)} aria-hidden="true">
            <FontAwesomeIcon icon={TERRAIN_ICONS[index % TERRAIN_ICONS.length]} />
          </Terrain>
        ))}
        <Route isDrawn={isDrawn} viewBox={`0 0 ${grid.width} ${grid.height}`} aria-hidden="true" focusable="false">
          <polyline points={route} fill="none" stroke="#3a3a3a" strokeWidth="0.03" strokeDasharray="0.06 0.08" />
          <polyline className="trail" points={route} fill="none" stroke="var(--accent)" strokeWidth="0.025" strokeLinecap="round" pathLength={1} />
        </Route>
        {regions.map(({ project, index, cell }) => (
          <Region
            key={project.title}
            type="button"
            style={{ ...place(cell, grid), "--kind": KIND_COLOURS[project.kind] } as CSSProperties}
            isDim={activeKind !== null && project.kind !== activeKind}
            isCurrent={!project.to}
            aria-label={describe(project)}
            onClick={() => onOpen(index)}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(index)}
            onBlur={() => setHovered(null)}
          >
            <RegionFace>
              <RegionIcon>
                <FontAwesomeIcon icon={project.icon} />
              </RegionIcon>
              <RegionYear>{yearOf(project.from)}</RegionYear>
            </RegionFace>
          </Region>
        ))}
      </Board>
      <Info aria-hidden="true">{hovered === null ? hint : describe(projects[hovered])}</Info>
    </div>
  );
};
