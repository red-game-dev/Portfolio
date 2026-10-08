import { FC, useState } from "react";

import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ActionButton } from "@/components/Controls";
import { Panel } from "@/components/Panel";
import { Section } from "@/components/Section";
import { SectionText } from "@/components/Text/SectionText";
import { RepoTimelapse } from "@/components/Timelapse/RepoTimelapse";
import { SECTION_IDS } from "@/config/sections";
import { SectionIntros } from "@/types/sections-intros";
import { TimelapseContent } from "@/types/timelapse";

interface TimelapseProps {
  intro: SectionIntros;
  content: TimelapseContent;
}

const BODY = `${SECTION_IDS.timelapse}-body`;

// The last section, after the finale, for readers who liked the site: its own history as a time-lapse, closed
// until they open it, so nothing of it, not even the history, loads before then.
export const Timelapse: FC<TimelapseProps> = ({ intro, content }: TimelapseProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Section id={SECTION_IDS.timelapse}>
      <SectionText intro={intro} />
      <Panel>
        <ActionButton type="button" isPrimary={false} aria-expanded={isOpen} aria-controls={BODY} onClick={() => setIsOpen((open) => !open)}>
          <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} aria-hidden="true" />
          {isOpen ? content.hide : content.show}
        </ActionButton>
        <div id={BODY}>{isOpen && <RepoTimelapse {...content} />}</div>
      </Panel>
    </Section>
  );
};
