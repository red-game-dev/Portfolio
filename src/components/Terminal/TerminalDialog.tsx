import { FC, useId, useRef } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { ActionButton, ActionLink } from "@/components/Controls";
import { DecodedText } from "@/components/DecodedText";
import useModalDialog from "@/hooks/useModalDialog";
import { TerminalDialog as TerminalDialogContent } from "@/packages/interaction/terminal";
import { media, squareBullet } from "@/styles/mixins";

interface TerminalDialogProps {
  dialog: TerminalDialogContent | null;
  closeLabel: string;
  onClose: () => void;
  onNavigate: (target: string) => void;
}

const materialise = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to { opacity: 1; transform: none; }
`;

// A native dialog: modal focus, Escape and the backdrop come from the browser. It keeps the browser's own
// position: fixed, which also anchors the scan line; any other position puts it at the top of the document,
// and opening it scrolls the page up there.
const Dialog = styled.dialog(() => [
  tw`w-[calc(100% - 32px)] max-w-[560px] max-h-[85vh] p-0 overflow-hidden text-left text-[#ccc] bg-[#0a0f0c]
     border-[1px] border-solid border-[var(--accent)]`,
  css`
    box-shadow: 0 0 40px rgba(var(--accent-rgb), 0.25);

    &[open] {
      animation: ${materialise} 0.35s cubic-bezier(0.165, 0.85, 0.45, 1);
    }

    &::backdrop {
      background: rgba(5, 8, 6, 0.75);
      backdrop-filter: blur(3px);
    }

    &[open]::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(to bottom, transparent 0%, rgba(var(--accent-rgb), 0.12) 50%, transparent 100%);
      animation: scan-beam 0.9s ease-out forwards;
    }

    ${media.reducedMotion} {
      &[open],
      &[open]::after {
        animation: none;
      }

      &[open]::after {
        display: none;
      }
    }
  `,
]);

const Body = tw.div`flex flex-col gap-[16px] p-[22px] md:p-[28px] max-h-[85vh] overflow-y-auto`;

const Kicker = tw.p`m-0 text-xs font-semibold text-[var(--accent)]`;

const Title = tw.h3`m-0 text-xl md:text-2xl font-semibold text-white`;

const Group = tw.section`flex flex-col gap-[8px]`;

const GroupHeading = tw.h4`m-0 text-xs font-medium text-[#8a948f]`;

const Items = tw.ul`list-none m-0 p-0 flex flex-col gap-[6px] text-sm`;

const Item = styled.li(() => [
  tw`relative pl-[16px] break-words`,
  squareBullet(),
]);

const Actions = tw.div`flex flex-row flex-wrap gap-[10px] pt-[6px]`;

const Close = tw.button`absolute top-[10px] right-[12px] z-[2] cursor-pointer text-xs text-[#8a948f] bg-transparent border-0 p-[6px] hover:text-white`;

// The rich answer to a terminal request, styled as a quest card that materialises over the page.
export const TerminalDialog: FC<TerminalDialogProps> = ({ dialog, closeLabel, onClose, onNavigate }: TerminalDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const onClick = useModalDialog(dialogRef, dialog !== null);

  return (
    <Dialog ref={dialogRef} onClose={onClose} onClick={onClick} aria-labelledby={titleId}>
      {dialog && (
        <>
          <Close type="button" onClick={() => dialogRef.current?.close()}>{closeLabel}</Close>
          <Body>
            <Kicker>
              <DecodedText text={dialog.title} isActive duration={700} />
            </Kicker>
            {dialog.subtitle && <Title id={titleId}>{dialog.subtitle}</Title>}
            {dialog.sections.filter((section) => section.items.length > 0).map((section) => (
              <Group key={section.heading}>
                <GroupHeading>{section.heading}</GroupHeading>
                <Items>
                  {section.items.map((item) => (
                    <Item key={item}>{item}</Item>
                  ))}
                </Items>
              </Group>
            ))}
            <Actions>
              {dialog.actions.map((action, index) => (action.kind === "link" ? (
                <ActionLink key={action.label} href={action.target} isPrimary={index === 0} target={action.target.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer">
                  {action.label}
                </ActionLink>
              ) : (
                <ActionButton key={action.label} type="button" isPrimary={index === 0} onClick={() => {
                  dialogRef.current?.close();
                  onNavigate(action.target);
                }}>
                  {action.label}
                </ActionButton>
              )))}
            </Actions>
          </Body>
        </>
      )}
    </Dialog>
  );
};
