import { FC, ReactNode, useId, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { itemName } from "@/components/Finale/Voyage/economy";
import { formText, pieceName, statLines } from "@/components/Finale/Voyage/gear";
import { TIER_COLOURS, TIER_ICONS } from "@/components/Finale/Voyage/Hangar/gearIcons";
import {
  Actions, Badge, BadgeRow, Item, ItemCount, ItemName, ItemTop, Meter, Note, RARITY_COLOUR, SmallButton, StatLine, StatList,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { BarFill } from "@/components/Finale/Voyage/VoyageDialog.styles";
import type { PieceView, VoyageAction } from "@/packages/games/voyage";
import type { EnhanceForm } from "@/packages/progression/enhancement";
import { fill, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

// A piece's enhancement as the sheet shows it: its tier's badge as many times as it counts (up to ten), in the
// tier's colour; nothing before the first step.
export const FormBadge: FC<{ content: FinaleVoyage; form: EnhanceForm }> = ({ content, form }) => {
  if (!form.tier) {
    return null;
  }

  return (
    <BadgeRow aria-label={formText(content, form)} title={formText(content, form)}>
      {Array.from({ length: Math.min(10, form.count) }, (_, index) => (
        <Badge key={index} colour={TIER_COLOURS[form.tier ?? "moon"]}>
          <FontAwesomeIcon icon={TIER_ICONS[form.tier ?? "moon"]} aria-hidden="true" />
        </Badge>
      ))}
    </BadgeRow>
  );
};

interface EnhanceProps {
  content: FinaleVoyage;
  piece: PieceView;
  stabilisers: number;
  onAct: (action: VoyageAction) => boolean;
}

// The next attempt at a piece: its chance, what a failure costs, what it takes, and a stabiliser to keep a failure
// from falling where there is one.
export const EnhancePanel: FC<EnhanceProps> = ({ content, piece, stabilisers, onAct }) => {
  const copy = content.gear.enhance;
  const [isProtected, setProtected] = useState(false);
  const protectId = useId();
  const { next } = piece;

  if (!next) {
    return <Note>{copy.top}</Note>;
  }

  const material = itemName(content.economy, next.material);
  const canPay = next.have >= next.count;

  return (
    <div>
      <Note>{`${fill(copy.chance, { chance: Math.round(next.chance * 100) })}. ${fill(copy.fall, { fall: next.fall })}.`}</Note>
      <Note>{fill(copy.cost, { coin: formatNumber(next.coin), count: next.count, material })}</Note>
      {stabilisers > 0 && (
        <label htmlFor={protectId}>
          <input id={protectId} type="checkbox" checked={isProtected} onChange={(event) => setProtected(event.target.checked)} />
          {` ${fill(copy.protect, { have: stabilisers })}`}
        </label>
      )}
      <Actions>
        <SmallButton type="button" isPrimary disabled={!canPay} onClick={() => onAct({ kind: "enhance", uid: piece.uid, isProtected: isProtected && stabilisers > 0 })}>
          {copy.button}
        </SmallButton>
        {!canPay && <Note>{copy.short}</Note>}
      </Actions>
    </div>
  );
};

interface PieceRowProps {
  content: FinaleVoyage;
  piece: PieceView;
  actions?: ReactNode;
}

// A piece in a list: its name in its rarity's colour, its level and how far into the next, its enhancement, and
// what it adds or fires.
export const PieceRow: FC<PieceRowProps> = ({ content, piece, actions }) => {
  const copy = content.gear;
  const lines = piece.armed
    ? [
      fill(copy.armed.damage, { value: formatNumber(piece.armed.damage) }),
      fill(copy.armed.rate, { value: formatNumber(piece.armed.rate, 1) }),
      fill(copy.armed.ammo, { ammo: copy.ammo[piece.armed.ammo] }),
    ]
    : statLines(content, piece.stats).map(({ label, value }) => `${label} ${value}`);

  return (
    <Item>
      <ItemTop>
        <ItemName colour={RARITY_COLOUR[piece.rarity]}>{pieceName(content, piece.base)}</ItemName>
        <ItemCount>{`${content.economy.rarities[piece.rarity]}, ${fill(copy.level, { level: piece.level })}`}</ItemCount>
      </ItemTop>
      <Meter role="meter" aria-label={fill(copy.level, { level: piece.level })} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(piece.levelShare * 100)}>
        <BarFill colour="#7dffcf" style={{ transform: `scaleX(${piece.levelShare})` }} />
      </Meter>
      <FormBadge content={content} form={piece.form} />
      <StatList>
        {lines.map((line) => <StatLine key={line}>{line}</StatLine>)}
      </StatList>
      {actions}
    </Item>
  );
};
