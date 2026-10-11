import { FC, useEffect, useRef } from "react";

import { ActionButton } from "@/components/Controls";
import { perkMax, perkName, perkNote, perksLine } from "@/components/Finale/Voyage/encounters";
import { PerkButton, PerkList, PerkName, PerkNote, PerkTaken } from "@/components/Finale/Voyage/Encounters/Encounters.styles";
import { Card, CardButtons, Overlay, Text, Title } from "@/components/Finale/Voyage/VoyageDialog.styles";
import { perkCount } from "@/packages/games/voyage";
import type { PerkId } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

interface PerkCardProps {
  content: FinaleVoyage;
  offer: readonly PerkId[];
  taken: readonly PerkId[];
  onChoose: (id: PerkId | null) => void;
}

// Three perks to choose one from (the run held still until one is chosen, or none): each its name, what it does and
// how many times this run has taken it, with the perks taken so far under them.
export const PerkCard: FC<PerkCardProps> = ({ content, offer, taken, onChoose }) => {
  const copy = content.encounters.perks;
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  return (
    <Overlay isPassThrough={false}>
      <Card isPassThrough={false} aria-labelledby="perk-title">
        <Title id="perk-title">{copy.title}</Title>
        <Text>{copy.note}</Text>
        <PerkList>
          {offer.map((id, index) => (
            <li key={id}>
              <PerkButton ref={index === 0 ? firstRef : undefined} type="button" onClick={() => onChoose(id)}>
                <PerkName>{perkName(content, id)}</PerkName>
                <PerkNote>{perkNote(content, id)}</PerkNote>
                <PerkTaken>{fill(copy.taken, { count: perkCount(taken, id), max: perkMax(id) })}</PerkTaken>
              </PerkButton>
            </li>
          ))}
        </PerkList>
        {taken.length > 0 && <Text>{fill(copy.owned, { perks: perksLine(content, taken) })}</Text>}
        <CardButtons>
          <ActionButton type="button" isPrimary={false} onClick={() => onChoose(null)}>{copy.skip}</ActionButton>
        </CardButtons>
      </Card>
    </Overlay>
  );
};
