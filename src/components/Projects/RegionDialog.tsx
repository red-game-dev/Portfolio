import { CSSProperties, FC, KeyboardEvent, useRef } from "react";

import { faArrowLeft, faArrowRight, faArrowUpRightFromSquare, faCodeBranch, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { VentureBlueprint } from "@/components/Blueprint";
import { ActionLink } from "@/components/Controls";
import { DecodedText } from "@/components/DecodedText";
import { KIND_COLOURS } from "@/components/Projects/config";
import {
  Badge,
  Body,
  Chip,
  Chips,
  Close,
  Deep,
  DeepHeading,
  DeepNote,
  Dialog,
  Footer,
  Group,
  GroupHeading,
  Header,
  Heading,
  Intro,
  Log,
  Loot,
  LootItem,
  Objective,
  Objectives,
  Scroll,
  Stat,
  StatLabel,
  Stats,
  StatValue,
  Title,
  Travel,
  TravelName,
  View,
  ViewIcon,
  ViewImage,
} from "@/components/Projects/RegionDialog.styles";
import { ScreenCarousel } from "@/components/Projects/ScreenCarousel";
import useModalDialog from "@/hooks/useModalDialog";
import { collapseWhitespace } from "@/packages/text/format";
import { ProjectDetail, ProjectMapContent } from "@/types/projects";

interface RegionDialogProps {
  project: ProjectDetail | null;
  previous: ProjectDetail | null;
  next: ProjectDetail | null;
  content: ProjectMapContent;
  period: string;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export const RegionDialog: FC<RegionDialogProps> = ({
  project, previous, next, content, period, onClose, onPrevious, onNext,
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
              <VentureBlueprint key={project.title} id={project.deepDive.blueprintId} />
            </Deep>
          )}
          <Footer>
            <Group>
              {project.link && (
                <ActionLink href={project.link} target="_blank" rel="noopener noreferrer" isPrimary>
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} aria-hidden="true" />
                  {labels.visit}
                </ActionLink>
              )}
              {project.repo && (
                <ActionLink href={project.repo} target="_blank" rel="noopener noreferrer" isPrimary={!project.link}>
                  <FontAwesomeIcon icon={faCodeBranch} aria-hidden="true" />
                  {labels.code}
                </ActionLink>
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
