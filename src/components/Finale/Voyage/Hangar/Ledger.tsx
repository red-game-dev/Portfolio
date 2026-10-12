import { FC, useState } from "react";

import { ledgerMemo } from "@/components/Finale/Voyage/economy";
import { Actions, Amount, Block, Entries, Entry, Frame, GroupTop, Note, SmallButton, Subheading } from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { PurseAmounts } from "@/components/Finale/Voyage/Money";
import type { EconomyView, VoyageAction } from "@/packages/games/voyage";
import { FinaleVoyage } from "@/types/game";

// The ledger: the balance, framed, then every coin earned and spent.
export const Ledger: FC<{ content: FinaleVoyage; economy: EconomyView }> = ({ content, economy }) => {
  const copy = content.economy;

  return (
    <>
      <Frame aria-labelledby="ledger-balance">
        <GroupTop>
          <Subheading id="ledger-balance">{copy.ledger.balance}</Subheading>
          <PurseAmounts copy={copy} purse={economy.purse} />
        </GroupTop>
      </Frame>
      {economy.history.length === 0 && <Note>{copy.ledger.empty}</Note>}
      <Entries>
        {economy.history.map((row) => (
          <Entry key={row.id}>
            <span>{ledgerMemo(content, row.memo)}</span>
            <Amount isGain={row.amounts.RED + row.amounts.VOID >= 0}><PurseAmounts copy={copy} purse={row.amounts} isSigned /></Amount>
          </Entry>
        ))}
      </Entries>
    </>
  );
};

// What is kept of the pilot, in this browser only, and starting again, asked twice. Not while flying.
export const YourData: FC<{ content: FinaleVoyage; isFlying: boolean; onAct: (action: VoyageAction) => boolean }> = ({ content, isFlying, onAct }) => {
  const copy = content.economy;
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <Block aria-labelledby="hangar-data">
      <Subheading id="hangar-data">{content.hangar.data}</Subheading>
      <Note>{copy.privacy}</Note>
      {!isFlying && (isConfirming ? (
        <Actions role="group" aria-label={copy.reset.confirm}>
          <Note>{copy.reset.confirm}</Note>
          <SmallButton type="button" onClick={() => {
            onAct({ kind: "reset" });
            setIsConfirming(false);
          }}>
            {copy.reset.yes}
          </SmallButton>
          <SmallButton type="button" isPrimary onClick={() => setIsConfirming(false)}>{copy.reset.no}</SmallButton>
        </Actions>
      ) : (
        <Actions>
          <SmallButton type="button" onClick={() => setIsConfirming(true)}>{copy.reset.button}</SmallButton>
        </Actions>
      ))}
    </Block>
  );
};
