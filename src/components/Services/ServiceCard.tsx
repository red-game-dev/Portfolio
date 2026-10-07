import { FC, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { faLinkedinIn } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { BitStrip } from "@/components/BitStrip";
import { DecodedText } from "@/components/DecodedText";
import { SERVICES_MOTION } from "@/components/Services/config";
import useInView from "@/hooks/useInView";
import { Service, ServiceActions } from "@/types/services";

interface ServiceCardProps extends Service {
  actions: ServiceActions;
  email: string;
  linkedInUrl: string;
  order: number;
}

const Card = styled.article(() => [
  tw`relative flex flex-col gap-[14px] p-[22px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`,
  css`
    transition: border-color 0.3s ease;

    &:hover,
    &:focus-within {
      border-color: var(--accent-muted);
    }
  `,
]);

const Heading = tw.div`flex flex-row items-center gap-[14px]`;

const Node = tw.span`flex flex-shrink-0 items-center justify-center w-[42px] h-[42px] rounded-full text-base text-[var(--accent)]
border-[1px] border-solid border-[var(--accent-muted)] bg-[#101010]`;

const Title = tw.h4`m-0 text-base lg:text-lg font-semibold text-white`;

const Description = tw.p`m-0 text-sm text-[#bbb] break-words`;

const Points = tw.ul`list-none m-0 p-0 flex flex-col gap-[6px] text-sm text-[#999]`;

const Point = styled.li(() => [
  tw`relative pl-[16px] break-words`,
  css`
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0.6em;
      width: 6px;
      height: 6px;
      border-radius: 1px;
      background: var(--accent);
    }
  `,
]);

const Actions = tw.div`mt-auto pt-[6px] flex flex-row flex-wrap gap-[10px]`;

const Action = styled.a(() => [
  tw`inline-flex flex-row items-center gap-2 h-[36px] px-[14px] text-sm font-medium no-underline text-[var(--accent)]
     border-[1px] border-solid border-[var(--accent-muted)] rounded-[2px]`,
  css`
    transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;

    &:hover,
    &:focus-visible {
      color: #101010;
      background-color: var(--accent);
      border-color: var(--accent);
    }
  `,
]);

export const ServiceCard: FC<ServiceCardProps> = ({
  icon, title, description, points = [], emailSubject, actions, email, linkedInUrl, order,
}: ServiceCardProps) => {
  const cardRef = useRef<HTMLElement>(null);
  const isInView = useInView(cardRef, { threshold: 0.2 });
  const delay = order * SERVICES_MOTION.cardDelayMs;

  return (
    <Card ref={cardRef}>
      <BitStrip cells={SERVICES_MOTION.stripCells} isActive={isInView} delay={delay} />
      <Heading>
        <Node aria-hidden="true">
          <FontAwesomeIcon icon={icon} />
        </Node>
        <Title>
          <DecodedText text={title} isActive={isInView} delay={delay} />
        </Title>
      </Heading>
      {description && <Description>{description}</Description>}
      {points.length > 0 && (
        <Points>
          {points.map((point) => (
            <Point key={point}>{point}</Point>
          ))}
        </Points>
      )}
      <Actions>
        <Action href={`mailto:${email}?subject=${encodeURIComponent(emailSubject)}`} aria-label={`${actions.email}: ${title}`}>
          <FontAwesomeIcon icon={faEnvelope} />
          {actions.email}
        </Action>
        <Action href={linkedInUrl} target="_blank" rel="noreferrer" aria-label={`${actions.linkedIn}: ${title}`}>
          <FontAwesomeIcon icon={faLinkedinIn} />
          {actions.linkedIn}
        </Action>
      </Actions>
    </Card>
  );
};
