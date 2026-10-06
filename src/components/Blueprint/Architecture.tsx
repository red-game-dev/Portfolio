import { FC, useId, useMemo, useRef } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { faDatabase, faUser } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useEdgeRoutes } from "@/components/Blueprint/hooks/useEdgeRoutes";
import { blockHash } from "@/components/Web3/utils/blockHash";
import { ZoneId } from "@/config/zones";
import { ArchitectureBlueprint, BlueprintGroup, BlueprintNode } from "@/types/blueprints";

interface ArchitectureProps extends ArchitectureBlueprint {
  zone: ZoneId;
  isShown: boolean;
  // Signals run along the wires while the drawing is on screen, unless the view is still.
  isMoving: boolean;
}

interface FlavourProps {
  zone: ZoneId;
}

// Wide enough for the columns to sit side by side; below this everything stacks in reading order.
const WIDE = "@media (min-width: 1024px)";

const signal = keyframes`
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
`;

const Diagram = styled.div(() => [
  tw`relative grid grid-cols-1 gap-[26px] lg:gap-[34px]`,
  css`
    ${WIDE} {
      grid-template-columns: repeat(var(--bp-cols), minmax(0, 1fr));
    }
  `,
]);

const ReadableWires = tw.ul`sr-only`;

// Each world draws its frames its own way: a terminal rule, a soft neural glow, a chain block, a neon
// table rim, or a game UI panel with cut corners.
const groupFlavour = (zone: ZoneId) => {
  switch (zone) {
    case "ai":
      return css`
        border-radius: 12px;
        box-shadow: inset 0 0 24px rgba(var(--accent-rgb), 0.05);
      `;
    case "casino":
      return css`
        border-radius: 14px;
        box-shadow: 0 0 0 1px rgba(var(--accent-rgb), 0.08), inset 0 0 18px rgba(var(--accent-rgb), 0.06);
      `;
    case "mmo":
      return css`
        clip-path: polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px);
        background: rgba(255, 196, 92, 0.03);
      `;
    default:
      return css``;
  }
};

const Group = styled.div(({ zone, hasFrame, isExternal }: FlavourProps & { hasFrame: boolean; isExternal: boolean }) => [
  tw`relative flex flex-col min-w-0`,
  hasFrame && tw`p-[12px] pt-[30px] border-[1px] border-solid border-[#2a2a2a] bg-[rgba(255, 255, 255, 0.015)]`,
  hasFrame && isExternal && tw`border-dashed border-[#3a3a3a]`,
  hasFrame && groupFlavour(zone),
  css`
    ${WIDE} {
      grid-column: var(--bp-col);
      grid-row: var(--bp-row);
    }
  `,
]);

const GroupLabel = tw.span`absolute top-[8px] left-[12px] right-[12px] text-[11px] font-semibold text-[var(--accent)] truncate`;

const Nodes = styled.div(() => [
  tw`grid gap-[10px] h-full content-center`,
  css`
    grid-template-columns: repeat(var(--bp-narrow), minmax(0, 1fr));

    ${WIDE} {
      grid-template-columns: repeat(var(--bp-inner), minmax(0, 1fr));
    }
  `,
]);

const nodeFlavour = (zone: ZoneId) => {
  switch (zone) {
    case "ai":
      return css`
        border-radius: 10px;
        border-color: var(--accent-muted);
        box-shadow: 0 0 14px rgba(var(--accent-rgb), 0.1);
      `;
    case "chain":
      return css`
        padding-top: 22px;
        border-color: var(--accent-muted);

        &::before {
          content: attr(data-hash);
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 3px 8px;
          font-size: 9px;
          letter-spacing: 0.04em;
          color: var(--accent);
          background: rgba(var(--accent-rgb), 0.08);
          border-bottom: 1px solid var(--accent-muted);
          overflow: hidden;
          white-space: nowrap;
        }
      `;
    case "casino":
      return css`
        border-radius: 8px;
        border-color: var(--accent-muted);
        box-shadow: inset 0 0 0 1px rgba(var(--accent-rgb), 0.12), 0 0 12px rgba(var(--accent-rgb), 0.14);
      `;
    case "mmo":
      return css`
        border-color: var(--accent-muted);
        clip-path: polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px);
        background: linear-gradient(180deg, #1a150c, #110e08);
      `;
    default:
      return css`
        border-left: 2px solid var(--accent);
      `;
  }
};

const Node = styled.div(({ zone, kind }: FlavourProps & { kind: BlueprintNode["kind"] }) => [
  tw`relative z-[1] flex flex-col gap-[2px] px-[10px] py-[8px] min-w-0 bg-[#101010] border-[1px] border-solid border-[#2e2e2e]`,
  nodeFlavour(zone),
  kind === "note" && tw`bg-[#0d0d0d] border-dashed`,
  kind === "decision" && css`
    border-style: double;
    border-width: 3px;
  `,
  css`
    grid-column: span var(--bp-span-narrow, 1);

    ${WIDE} {
      grid-column: span var(--bp-span, 1);
    }
  `,
]);

const NodeLabel = tw.span`flex flex-row items-center gap-[6px] text-xs md:text-sm font-semibold text-white leading-snug break-words`;

const NodeDetail = tw.span`text-[11px] md:text-xs text-[#9a9a9a] leading-snug break-words`;

const KindIcon = tw.span`text-[var(--accent)] text-[11px]`;

const Diamond = tw.span`inline-block w-[7px] h-[7px] rotate-45 bg-[var(--accent)]`;

const Wires = styled.svg(({ isMoving }: { isMoving: boolean }) => [
  tw`absolute top-0 left-0 z-0 pointer-events-none overflow-visible`,
  css`
    .wire {
      fill: none;
      stroke: var(--accent-muted);
      stroke-width: 1.5;
    }

    .wire.dashed {
      stroke-dasharray: 5 4;
    }

    .signal {
      fill: none;
      stroke: var(--accent);
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-dasharray: 2.5 97.5;
      opacity: 0;
    }

    .label {
      font-size: 10px;
      fill: #c8c8c8;
      paint-order: stroke;
      stroke: #0d0d0d;
      stroke-width: 4px;
      stroke-linejoin: round;
    }
  `,
  isMoving && css`
    .signal {
      opacity: 1;
      animation: ${signal} 2.6s linear infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .signal {
        display: none;
      }
    }
  `,
]);

const narrowColumns = (columns: number) => Math.min(columns, 2);

const placementStyle = (group: BlueprintGroup) => {
  const { col, row, colSpan = 1, rowSpan = 1 } = group.place;
  const columns = group.columns ?? 1;

  return {
    "--bp-col": `${col} / span ${colSpan}`,
    "--bp-row": `${row} / span ${rowSpan}`,
    "--bp-inner": columns,
    "--bp-narrow": narrowColumns(columns),
  } as React.CSSProperties;
};

const nodeStyle = (node: BlueprintNode, columns: number) => ({
  "--bp-span": Math.min(node.span ?? 1, columns),
  "--bp-span-narrow": Math.min(node.span ?? 1, narrowColumns(columns)),
} as React.CSSProperties);

const KIND_ICONS = { store: faDatabase, actor: faUser };

// A system drawn as boxes in frames with wires between them: the structure a Mermaid flowchart would give,
// in the look of the world it belongs to. Wires are routed from the measured boxes, so they follow any reflow.
export const Architecture: FC<ArchitectureProps> = ({ zone, columns, groups, edges, isShown, isMoving }: ArchitectureProps) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const layout = useEdgeRoutes(diagramRef, edges, isShown);
  const markerId = `bp-arrow-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const names = useMemo(() => new Map(groups.flatMap((group) => [
    [group.id, group.label ?? ""] as const,
    ...group.nodes.map((node) => [node.id, node.label] as const),
  ])), [groups]);

  return (
    <Diagram ref={diagramRef} style={{ "--bp-cols": columns } as React.CSSProperties}>
      <Wires isMoving={isMoving} width={layout.width} height={layout.height} aria-hidden="true">
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
          </marker>
        </defs>
        {layout.edges.map(({ key, edge, route }, index) => {
          const isLink = edge.style === "link";

          return (
            <g key={key}>
              <path
                className={`wire${edge.style === "dashed" ? " dashed" : ""}`}
                d={route.d}
                markerEnd={isLink ? undefined : `url(#${markerId})`}
                markerStart={edge.isTwoWay ? `url(#${markerId})` : undefined}
              />
              {!isLink && edge.style !== "dashed" && (
                <path className="signal" d={route.d} pathLength={100} style={{ animationDelay: `${(index % 7) * -0.37}s` }} />
              )}
              {edge.label && (
                <text className="label" x={route.mid.x} y={route.mid.y - 4} textAnchor="middle">{edge.label}</text>
              )}
            </g>
          );
        })}
      </Wires>
      {groups.map((group) => {
        const groupColumns = group.columns ?? 1;

        return (
          <Group
            key={group.id}
            data-bp-id={group.id}
            zone={zone}
            hasFrame={Boolean(group.label)}
            isExternal={Boolean(group.isExternal)}
            style={placementStyle(group)}
          >
            {group.label && <GroupLabel>{group.label}</GroupLabel>}
            <Nodes>
              {group.nodes.map((node) => {
                const icon = node.kind === "store" || node.kind === "actor" ? KIND_ICONS[node.kind] : null;

                return (
                  <Node key={node.id} data-bp-id={node.id} data-hash={blockHash(node.id)} zone={zone} kind={node.kind} style={nodeStyle(node, groupColumns)}>
                    <NodeLabel>
                      {icon && <KindIcon aria-hidden="true"><FontAwesomeIcon icon={icon} /></KindIcon>}
                      {node.kind === "decision" && <Diamond aria-hidden="true" />}
                      {node.label}
                    </NodeLabel>
                    {node.detail && <NodeDetail>{node.detail}</NodeDetail>}
                  </Node>
                );
              })}
            </Nodes>
          </Group>
        );
      })}
      {/* The wires as sentences, for readers who cannot see the drawing. */}
      <ReadableWires>
        {edges.map((edge, index) => (
          <li key={`${edge.from}-${edge.to}-${index}`}>
            {`${names.get(edge.from) ?? edge.from} to ${names.get(edge.to) ?? edge.to}${edge.label ? `: ${edge.label}` : ""}`}
          </li>
        ))}
      </ReadableWires>
    </Diagram>
  );
};
