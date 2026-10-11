import { FC } from "react";

import {
  Actions, Block, Item, ItemCount, ItemName, Items, ItemTop, Note, SmallButton, Subheading,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import type { ProgressView, VoyageAction } from "@/packages/games/voyage";
import { TALENT_BRANCHES, TALENT_EVERY } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

const BRANCH_COLOUR = { gunnery: "#ff8a5c", engineering: "#4fd8ff", navigation: "#7dffb0" };

// The pilot's talent tree: the points their level gives and those left, then each branch with its talents, each with
// its rank, what it does and the way to learn the next rank (or what it waits for); and every point taken back.
export const Talents: FC<{ content: FinaleVoyage; progress: ProgressView; onAct: (action: VoyageAction) => boolean }> = ({ content, progress, onAct }) => {
  const copy = content.talents;
  const { points, left, entries } = progress.talents;

  return (
    <Block aria-labelledby="talents-title">
      <Subheading id="talents-title">{copy.title}</Subheading>
      <Note>{fill(copy.note, { every: TALENT_EVERY })}</Note>
      <Note>{fill(copy.points, { left, points })}</Note>
      {TALENT_BRANCHES.map((branch) => (
        <section key={branch} aria-labelledby={`talents-${branch}`}>
          <Subheading id={`talents-${branch}`}>{copy.branches[branch]}</Subheading>
          <Items>
            {entries.filter(({ spec }) => spec.branch === branch).map(({ spec, rank, canLearn }) => {
              const name = copy.names[spec.id]?.name ?? spec.id;
              const isLocked = rank === 0 && !canLearn && left > 0;
              const note = isLocked && spec.requires > 0
                ? fill(copy.locked, { requires: spec.requires, branch: copy.branches[branch] })
                : copy.names[spec.id]?.note ?? "";

              return (
                <Item key={spec.id}>
                  <ItemTop>
                    <ItemName colour={rank > 0 ? BRANCH_COLOUR[branch] : "#c9cfdf"}>{name}</ItemName>
                    <ItemCount>{fill(copy.rank, { rank, max: spec.max })}</ItemCount>
                  </ItemTop>
                  <Note>{note}</Note>
                  {rank < spec.max && (
                    <Actions>
                      <SmallButton type="button" isPrimary={canLearn} disabled={!canLearn} onClick={() => onAct({ kind: "learn", talent: spec.id })}>
                        {copy.learn}
                      </SmallButton>
                    </Actions>
                  )}
                </Item>
              );
            })}
          </Items>
        </section>
      ))}
      {left < points && (
        <Actions>
          <SmallButton type="button" onClick={() => onAct({ kind: "unlearn" })}>{copy.reset}</SmallButton>
        </Actions>
      )}
    </Block>
  );
};
