import { FC, useId, useMemo, useRef, useState } from "react";

import { faDatabase, faMagnifyingGlassMinus, faMagnifyingGlassPlus, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  Controls,
  Diagram,
  Diamond,
  Group,
  GroupLabel,
  Hint,
  KindIcon,
  Node,
  NodeDetail,
  NodeLabel,
  Nodes,
  Root,
  Viewport,
  WireArrow,
  WireItem,
  WireList,
  Wires,
  Zoom,
} from "@/components/Blueprint/Architecture.styles";
import { useEdgeRoutes } from "@/components/Blueprint/hooks/useEdgeRoutes";
import { minWideWidth } from "@/components/Blueprint/utils/layout";
import { blockHash } from "@/components/Web3/utils/blockHash";
import { ZoneId } from "@/config/zones";
import useSize from "@/hooks/useSize";
import { ArchitectureBlueprint, BlueprintGroup, BlueprintLabels, BlueprintNode } from "@/types/blueprints";

interface ArchitectureProps extends ArchitectureBlueprint {
  zone: ZoneId;
  labels: Pick<BlueprintLabels, "zoomIn" | "zoomOut" | "fitHint" | "panHint">;
  isShown: boolean;
  // Signals run along the wires while the drawing is on screen, unless the view is still.
  isMoving: boolean;
}

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
export const Architecture: FC<ArchitectureProps> = ({ zone, columns, groups, edges, isShown, isMoving, labels }: ArchitectureProps) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const layout = useEdgeRoutes(diagramRef, edges, isShown);
  const { width: room } = useSize(viewportRef);
  const { height: diagramHeight } = useSize(diagramRef);
  const needed = minWideWidth({ columns, groups, edges });
  const isTight = room > 0 && room < needed;
  const [isZoomed, setIsZoomed] = useState(false);
  const scale = isTight && !isZoomed ? room / needed : 1;
  const markerId = `bp-arrow-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const names = useMemo(() => new Map(groups.flatMap((group) => [
    [group.id, group.label ?? ""] as const,
    ...group.nodes.map((node) => [node.id, node.label] as const),
  ])), [groups]);

  return (
    <Root>
      {isTight && (
        <Controls>
          <Hint>{isZoomed ? labels.panHint : labels.fitHint}</Hint>
          <Zoom type="button" aria-pressed={isZoomed} onClick={() => setIsZoomed((value) => !value)}>
            <FontAwesomeIcon icon={isZoomed ? faMagnifyingGlassMinus : faMagnifyingGlassPlus} aria-hidden="true" />
            {isZoomed ? labels.zoomOut : labels.zoomIn}
          </Zoom>
        </Controls>
      )}
      <Viewport
        ref={viewportRef}
        isPanning={isTight && isZoomed}
        data-scroll-x={isTight && isZoomed ? true : undefined}
        style={isTight && diagramHeight > 0 ? { height: Math.ceil(diagramHeight * scale) } : undefined}
      >
    <Diagram
      ref={diagramRef}
      data-wide="true"
      style={{
        "--bp-cols": columns,
        "width": isTight ? needed : undefined,
        "transform": scale < 1 ? `scale(${scale})` : undefined,
        "transformOrigin": "top left",
      } as React.CSSProperties}
    >
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
      <WireList>
        {edges.map((edge, index) => (
          <WireItem key={`${edge.from}-${edge.to}-${index}`}>
            {names.get(edge.from) ?? edge.from}
            <WireArrow>{edge.style === "link" ? " with " : " to "}</WireArrow>
            {names.get(edge.to) ?? edge.to}
            {edge.label ? `, ${edge.label}` : ""}
          </WireItem>
        ))}
      </WireList>
    </Diagram>
      </Viewport>
    </Root>
  );
};
