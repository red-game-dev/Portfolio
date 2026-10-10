import { CSSProperties, FC } from "react";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { slotLabel, slotState } from "@/components/Finale/Voyage/abilities";
import { Bar, Cooldown, Left, Pip, Pips, Plus, Slot, SlotCount, SlotIcon, SlotKey } from "@/components/Finale/Voyage/AbilityBar/AbilityBar.styles";
import { slotIcon } from "@/components/Finale/Voyage/AbilityBar/icons";
import type { BarRow, VoyageSnapshot } from "@/packages/games/voyage";
import { FinaleVoyage } from "@/types/game";

interface AbilityBarProps {
  content: FinaleVoyage;
  rows: BarRow[];
  boosts: VoyageSnapshot["boosts"] | null;
  // A slot pressed: what it holds used, or the hangar's Loadout opened for an empty one.
  onUse: (index: number) => void;
  onFill: () => void;
}

// The most levels a boost reaches, one pip each.
const LEVELS = 5;
// What a thing from the hold looks like on the bar.
const ITEM_COLOUR = "#c9cfdf";

// The ability bar: four slots of boosts and things from the hold, each with its key, what is left, a boost's
// level, a glow while it is on and a sweep while it cools down. A press of a spent slot still says why nothing
// happened; an empty one opens the Loadout.
export const AbilityBar: FC<AbilityBarProps> = ({ content, rows, boosts, onUse, onFill }: AbilityBarProps) => (
  <Bar role="group" aria-label={content.boosts.bar.label}>
    {rows.map((row, index) => {
      const state = slotState(row, boosts);
      const colour = row.colour ?? ITEM_COLOUR;
      const key = row.slot ? `${row.slot.kind}:${row.slot.id}` : `empty:${index}`;

      return (
        <Slot
          key={key}
          type="button"
          colour={colour}
          isEmpty={!row.slot}
          isOn={state.isOn}
          aria-label={slotLabel(content, row, index, state)}
          onClick={() => (row.slot ? onUse(index) : onFill())}
        >
          <SlotKey aria-hidden="true">{index + 1}</SlotKey>
          {row.slot ? (
            <>
              <SlotIcon isSpent={state.isSpent} aria-hidden="true">
                <FontAwesomeIcon icon={slotIcon(row.slot)} />
              </SlotIcon>
              {row.slot.kind === "boost" && (
                <Pips aria-hidden="true">
                  {Array.from({ length: LEVELS }, (_, level) => <Pip key={level} isLit={level < row.level} />)}
                </Pips>
              )}
              <SlotCount aria-hidden="true">{row.count}</SlotCount>
              {state.cooldown && (
                <Cooldown aria-hidden="true" style={{ "--cool": state.cooldown.share } as CSSProperties}>{state.cooldown.seconds}</Cooldown>
              )}
              {state.isOn && <Left aria-hidden="true" style={{ transform: `scaleX(${state.left})` }} />}
            </>
          ) : (
            <Plus aria-hidden="true">
              <FontAwesomeIcon icon={faPlus} />
            </Plus>
          )}
        </Slot>
      );
    })}
  </Bar>
);
