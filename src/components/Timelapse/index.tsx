import { FC, useState } from "react";

import tw, { styled } from "twin.macro";

import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { actionStyle } from "@/components/Controls";
import { Panel, PanelTitle } from "@/components/Panel";
import { RepoTimelapse } from "@/components/Timelapse/RepoTimelapse";
import { TimelapseContent } from "@/types/timelapse";

const Description = tw.p`m-0 mt-[10px] text-sm text-[#bbb] max-w-[70ch]`;

const Toggle = styled.button(() => [actionStyle(false), tw`mt-[16px]`]);

const ID = "repo-timelapse";

// The repo time-lapse, closed until a reader who likes the numbers opens it: nothing of it, not even its history,
// loads before then.
export const Timelapse: FC<TimelapseContent> = (content: TimelapseContent) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Panel>
      <PanelTitle>{content.title}</PanelTitle>
      {content.description.map((paragraph) => <Description key={paragraph}>{paragraph}</Description>)}
      <Toggle type="button" aria-expanded={isOpen} aria-controls={ID} onClick={() => setIsOpen((open) => !open)}>
        <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} aria-hidden="true" />
        {isOpen ? content.hide : content.show}
      </Toggle>
      <div id={ID}>{isOpen && <RepoTimelapse {...content} />}</div>
    </Panel>
  );
};
