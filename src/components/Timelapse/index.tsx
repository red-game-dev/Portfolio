import { FC, useState } from "react";

import tw from "twin.macro";

import { faChevronDown, faChevronUp, faHeart } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ActionButton, ActionLink } from "@/components/Controls";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
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

const Support = tw.p`m-0 mt-[14px] flex flex-row flex-wrap items-center gap-[10px] text-sm text-[#9aa3bb]`;

// The last section, after the finale, for readers who liked the site: its own history as a time-lapse, closed
// until they open it, so nothing of it, not even the history, loads before then.
export const Timelapse: FC<TimelapseProps> = ({ intro, content }: TimelapseProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { lens } = useLensStateHook();
  const { support } = content;

  return (
    <Section id={SECTION_IDS.timelapse}>
      <SectionText intro={intro} />
      <Panel>
        <ActionButton type="button" isPrimary={false} aria-expanded={isOpen} aria-controls={BODY} onClick={() => setIsOpen((open) => !open)}>
          <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} aria-hidden="true" />
          {isOpen ? content.hide : content.show}
        </ActionButton>
        <div id={BODY}>{isOpen && <RepoTimelapse {...content} />}</div>
        {support.url && lens !== "recruiter" && (
          <Support>
            {support.note}
            <ActionLink href={support.url} target="_blank" rel="noopener noreferrer" isPrimary={false}>
              <FontAwesomeIcon icon={faHeart} aria-hidden="true" />
              {support.label}
            </ActionLink>
          </Support>
        )}
      </Panel>
    </Section>
  );
};
