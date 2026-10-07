import { CSSProperties, FC, KeyboardEvent, useRef } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { faArrowLeft, faArrowRight, faArrowUpRightFromSquare, faCodeBranch, faXmark } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { VentureBlueprint } from "@/components/Blueprint";
import { DecodedText } from "@/components/DecodedText";
import { Image } from "@/components/Image";
import { KIND_COLOURS } from "@/components/Projects/config";
import { ScreenCarousel } from "@/components/Projects/ScreenCarousel";
import useModalDialog from "@/hooks/useModalDialog";
import { collapseWhitespace } from "@/packages/text/format";
import { BlueprintLabels } from "@/types/blueprints";
import { ProjectDetail, ProjectMapContent } from "@/types/projects";

interface RegionDialogProps {
  project: ProjectDetail | null;
  blueprintLabels: BlueprintLabels;
  previous: ProjectDetail | null;
  next: ProjectDetail | null;
  content: ProjectMapContent;
  period: string;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

const HEX = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";

const unfold = keyframes`
  from { opacity: 0; transform: scale(0.94); clip-path: inset(48% 0 48% 0); }
  to { opacity: 1; transform: none; clip-path: inset(0 0 0 0); }
`;

// The map screen of a region, opened like a game's map: it unfolds from a line into the full view.
const Dialog = styled.dialog(() => [
  tw`w-[calc(100% - 24px)] max-w-[920px] max-h-[90vh] p-0 overflow-hidden text-left text-[#ccc] bg-[#0b0b0b]
     border-[1px] border-solid border-[var(--kind)]`,
  css`
    box-shadow: 0 0 50px color-mix(in srgb, var(--kind) 25%, transparent);

    &[open] {
      animation: ${unfold} 0.4s cubic-bezier(0.165, 0.85, 0.45, 1);
    }

    &::backdrop {
      background: rgba(5, 5, 5, 0.78);
      backdrop-filter: blur(3px);
    }

    @media (prefers-reduced-motion: reduce) {
      &[open] {
        animation: none;
      }
    }
  `,
]);

const Scroll = tw.div`max-h-[90vh] overflow-y-auto`;

const Header = tw.header`flex flex-row items-center gap-[14px] p-[18px] md:p-[22px] pr-[56px] border-0 border-b-[1px] border-solid border-[#1E1E1E]`;

const Badge = styled.span(() => [
  tw`flex flex-shrink-0 items-center justify-center w-[52px] h-[58px] text-xl text-[#101010] bg-[var(--kind)]`,
  css`
    clip-path: ${HEX};
  `,
]);

const Heading = tw.div`flex flex-col gap-[6px] min-w-0`;

const Title = tw.h3`m-0 text-lg md:text-2xl font-semibold text-white`;

const Chips = tw.div`flex flex-row flex-wrap gap-[6px] text-xs`;

const Chip = styled.span(({ isKind }: { isKind?: boolean }) => [
  tw`leading-none py-[5px] px-[8px] rounded-full border-[1px] border-solid border-[#2a2a2a] text-[#bbb]`,
  isKind && tw`text-[var(--kind)] border-[var(--kind)]`,
]);

const Close = tw.button`absolute top-[14px] right-[14px] z-[3] flex items-center justify-center w-[36px] h-[36px] cursor-pointer text-lg
text-[#999] bg-transparent border-0 hover:text-white`;

const Body = styled.div(() => [
  tw`grid gap-[22px] p-[18px] md:p-[22px]`,
  css`
    @media (min-width: 768px) {
      grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    }
  `,
]);

// The region's view: its screenshot under a map grid, or its own terrain when there is no picture.
const View = styled.div(() => [
  tw`relative overflow-hidden min-h-[200px] md:min-h-[300px] bg-[#101010] border-[1px] border-solid border-[#1E1E1E]`,
  css`
    background-image:
      linear-gradient(color-mix(in srgb, var(--kind) 10%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in srgb, var(--kind) 10%, transparent) 1px, transparent 1px);
    background-size: 24px 24px;

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
      background-size: 24px 24px;
      box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.7);
    }
  `,
]);

const ViewImage = styled(Image)(() => [
  tw`object-cover`,
]);

const ViewIcon = tw.span`absolute inset-0 flex items-center justify-center text-[96px] text-[var(--kind)] opacity-80`;

const Log = tw.div`flex flex-col gap-[16px]`;

const Intro = tw.p`m-0 text-sm md:text-base text-[#ddd] break-words`;

const GroupHeading = tw.h4`m-0 text-xs font-semibold text-[var(--kind)]`;

const Objectives = tw.ul`list-none m-0 p-0 flex flex-col gap-[8px] text-sm`;

const Objective = styled.li(() => [
  tw`relative pl-[24px] break-words`,
  css`
    &::before {
      content: "\\2713";
      position: absolute;
      left: 0;
      top: 0;
      width: 16px;
      height: 16px;
      font-size: 11px;
      line-height: 16px;
      text-align: center;
      color: #101010;
      background: var(--kind);
    }
  `,
]);

const Loot = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-[6px]`;

const LootItem = tw.li`text-xs leading-none text-[#eee] bg-[#1a1a1a] rounded-[2px] py-[6px] px-[8px] border-[1px] border-solid border-[#2a2a2a]`;

// A venture of my own goes deeper: its numbers, then how it was built and what users moved through.
const Deep = tw.section`flex flex-col gap-[14px] px-[18px] pb-[18px] md:px-[22px] md:pb-[22px]`;

const DeepHeading = tw.h3`m-0 text-base font-semibold text-white`;

const Stats = tw.ul`list-none m-0 p-0 grid gap-[10px] grid-cols-2 md:grid-cols-4`;

const Stat = tw.li`flex flex-col gap-[4px] p-[12px] bg-[#111] border-[1px] border-solid border-[#222]`;

const StatValue = tw.span`text-2xl font-semibold leading-none text-[var(--kind)]`;

const StatLabel = tw.span`text-xs text-[#aaa]`;

const DeepNote = tw.p`m-0 text-sm text-[#bbb] max-w-[70ch]`;


const Footer = tw.footer`flex flex-col md:flex-row md:items-center md:justify-between gap-[12px] p-[18px] md:p-[22px]
border-0 border-t-[1px] border-solid border-[#1E1E1E]`;

const Group = tw.div`flex flex-row flex-wrap gap-[10px]`;

const actionStyle = (isPrimary: boolean) => [
  tw`inline-flex flex-row items-center gap-[8px] h-[38px] px-[14px] cursor-pointer text-sm font-semibold no-underline rounded-[2px]
     border-[1px] border-solid`,
  isPrimary ? tw`text-[#101010] bg-[var(--kind)] border-[var(--kind)]` : tw`text-[var(--kind)] bg-transparent border-[#2a2a2a]`,
  css`
    transition: filter 0.2s ease, border-color 0.2s ease;

    &:hover,
    &:focus-visible {
      filter: brightness(1.12);
      border-color: var(--kind);
    }
  `,
];

const Action = styled.a(({ isPrimary }: { isPrimary: boolean }) => actionStyle(isPrimary));

const Travel = styled.button(() => [
  ...actionStyle(false),
  tw`max-w-full md:max-w-[220px] disabled:opacity-30 disabled:cursor-default`,
]);

const TravelName = tw.span`truncate`;

export const RegionDialog: FC<RegionDialogProps> = ({
  project, blueprintLabels, previous, next, content, period, onClose, onPrevious, onNext,
}: RegionDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { labels } = content;

  const onClick = useModalDialog(dialogRef, project !== null);

  // Arrow keys travel between regions, like moving across a map, unless they are moving something sideways
  // inside the dialog (anything marked data-scroll-x: a strip of screens, a row of tabs) or carry a modifier.
  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || (event.target as HTMLElement).closest("[data-scroll-x]")) {
      return;
    }

    if (event.key === "ArrowLeft" && previous) {
      onPrevious();
    } else if (event.key === "ArrowRight" && next) {
      onNext();
    }
  };

  const style = { "--kind": project ? KIND_COLOURS[project.kind] : "var(--accent)" } as CSSProperties;

  return (
    <Dialog ref={dialogRef} style={style} onClose={onClose} onClick={onClick} onKeyDown={onKeyDown} aria-labelledby="region-dialog-title">
      {project && (
        <Scroll>
          <Close type="button" aria-label={labels.close} onClick={() => dialogRef.current?.close()}>
            <FontAwesomeIcon icon={faXmark} />
          </Close>
          <Header>
            <Badge aria-hidden="true">
              <FontAwesomeIcon icon={project.icon} />
            </Badge>
            <Heading>
              <Title id="region-dialog-title">
                <DecodedText key={project.title} text={project.title} isActive duration={600} />
              </Title>
              <Chips>
                <Chip isKind>{content.kinds[project.kind]}</Chip>
                <Chip>{content.statuses[project.status]}</Chip>
                <Chip>{period}</Chip>
                <Chip>{project.category}</Chip>
              </Chips>
            </Heading>
          </Header>
          <Body>
            <View>
              {project.image ? (
                <ViewImage
                  key={project.image}
                  src={project.image}
                  alt=""
                  fallbackSrc={project.image.replace(".webp", ".jpg")}
                  fill
                  sizes="(min-width: 768px) 400px, 100vw"
                />
              ) : (
                <ViewIcon aria-hidden="true">
                  <FontAwesomeIcon icon={project.icon} />
                </ViewIcon>
              )}
            </View>
            <Log>
              <Intro>{collapseWhitespace(project.intro)}</Intro>
              <GroupHeading>{labels.questLog}</GroupHeading>
              <Objectives>
                {project.responsibilities.map((objective) => (
                  <Objective key={objective}>{objective}</Objective>
                ))}
              </Objectives>
              {project.techStack.length > 0 && (
                <>
                  <GroupHeading>{labels.loot}</GroupHeading>
                  <Loot>
                    {project.techStack.map((tech) => (
                      <LootItem key={tech}>{tech}</LootItem>
                    ))}
                  </Loot>
                </>
              )}
            </Log>
          </Body>
          {project.deepDive && (
            <Deep>
              <DeepHeading>{labels.deepDive}</DeepHeading>
              {project.deepDive.stats && project.deepDive.stats.length > 0 && (
              <Stats>
                {project.deepDive.stats.map((stat) => (
                  <Stat key={stat.label}>
                    <StatValue>{stat.value}</StatValue>
                    <StatLabel>{stat.label}</StatLabel>
                  </Stat>
                ))}
              </Stats>
              )}
              {project.deepDive.note && <DeepNote>{project.deepDive.note}</DeepNote>}
              {project.deepDive.screens && project.deepDive.screens.length > 0 && (
                <>
                  <GroupHeading>{labels.screens}</GroupHeading>
                  <ScreenCarousel
                    key={project.title}
                    screens={project.deepDive.screens}
                    labels={{ previous: labels.screenPrevious, next: labels.screenNext, position: labels.screenPosition }}
                  />
                </>
              )}
              <VentureBlueprint key={project.title} id={project.deepDive.blueprintId} labels={blueprintLabels} />
            </Deep>
          )}
          <Footer>
            <Group>
              {project.link && (
                <Action href={project.link} target="_blank" rel="noopener noreferrer" isPrimary>
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} aria-hidden="true" />
                  {labels.visit}
                </Action>
              )}
              {project.repo && (
                <Action href={project.repo} target="_blank" rel="noopener noreferrer" isPrimary={!project.link}>
                  <FontAwesomeIcon icon={faCodeBranch} aria-hidden="true" />
                  {labels.code}
                </Action>
              )}
            </Group>
            <Group>
              <Travel type="button" onClick={onPrevious} disabled={!previous} aria-label={previous ? `${labels.previous}: ${previous.title}` : labels.previous}>
                <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                <TravelName>{previous?.title ?? labels.previous}</TravelName>
              </Travel>
              <Travel type="button" onClick={onNext} disabled={!next} aria-label={next ? `${labels.next}: ${next.title}` : labels.next}>
                <TravelName>{next?.title ?? labels.next}</TravelName>
                <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
              </Travel>
            </Group>
          </Footer>
        </Scroll>
      )}
    </Dialog>
  );
};
