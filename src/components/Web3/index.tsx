import { FC, useMemo } from "react";

import tw from "twin.macro";

import { BlueprintList } from "@/components/Blueprint";
import { Panel } from "@/components/Panel";
import { SectionText } from "@/components/Text/SectionText";
import { Block } from "@/components/Web3/Block";
import { Stack } from "@/components/Web3/Stack";
import { TxFlow } from "@/components/Web3/TxFlow";
import { blockHash, GENESIS_HASH } from "@/components/Web3/utils/blockHash";
import { ROLE_ANCHORS, SECTION_IDS } from "@/config/sections";
import { Blueprint, BlueprintLabels } from "@/types/blueprints";
import { Web3Content } from "@/types/domains";
import { SectionIntros } from "@/types/sections-intros";

interface Web3Props {
  intro: SectionIntros;
  content: Web3Content;
  blueprints: Blueprint[];
  blueprintLabels: BlueprintLabels;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

// Target for the "Web3" link on the first screen.
const Anchor = tw.span`absolute top-0 left-0`;

const Statement = tw.p`m-0 text-base md:text-lg text-white max-w-[70ch]`;

const Validators = tw.div`flex flex-row flex-wrap items-center gap-[8px] mt-[14px] mb-[22px] text-sm text-[#999]`;

const Validator = tw.span`text-xs leading-none text-white bg-[#1d1d1d] rounded-[2px] py-[6px] px-[8px] border-[1px] border-solid border-[#2a2a2a]`;

const Blueprints = tw.div`mt-[25px] lg:mt-[35px]`;

const Chain = tw.ol`list-none m-0 p-0 grid gap-[14px] md:grid-cols-2`;

// Web3 as a chain of blocks: every capability is a block that points at the one before it.
export const Web3: FC<Web3Props> = ({ intro, content, blueprints, blueprintLabels }: Web3Props) => {
  const hashes = useMemo(() => content.capabilities.map((capability) => blockHash(capability.name)), [content.capabilities]);

  return (
    <Section id={SECTION_IDS.web3}>
      <Anchor id={ROLE_ANCHORS.web3} aria-hidden="true" />
      <SectionText intro={intro} />
      <Panel>
        <Statement>{content.statement}</Statement>
        <Validators>
          <span>{content.validatorsLabel}</span>
          {content.validators.map((validator) => (
            <Validator key={validator}>{validator}</Validator>
          ))}
        </Validators>
        <Stack title={content.stackTitle} groups={content.stack} />
        <TxFlow {...content.flow} />
        <Chain>
          {content.capabilities.map((capability, index) => (
            <Block
              key={capability.name}
              {...capability}
              height={index + 1}
              hash={hashes[index]}
              previousHash={index === 0 ? GENESIS_HASH : hashes[index - 1]}
              labels={content}
            />
          ))}
        </Chain>
      </Panel>
      <Blueprints>
        <BlueprintList blueprints={blueprints} labels={blueprintLabels} />
      </Blueprints>
    </Section>
  );
};
