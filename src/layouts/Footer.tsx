import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import Link from "next/link";

interface FooterProps {
  linkedInUsername: string;
}

const FooterContainer = styled.footer(() => [
  tw`p-0 fixed bottom-0 left-12 right-12 w-auto h-1 z-[10] hidden lg:block`
]);

const SocialMediaList = styled.ul(() => [
  tw`float-right absolute right-0 bottom-0 w-6 list-none last:mb-0`
]);

const FollowMeButton = styled.li(() => [
  tw`
    pr-20 absolute bottom-full right-[5px] text-[#bbb] text-sm leading-6 h-6 whitespace-nowrap origin-[100% 0] text-right rotate-90
    after:content[''] after:absolute after:top-1/2 after:right-0 after:w-12 after:h-1 after:bg-[#4bffa5]
  `
]);

const SocialMediaItem = styled(Link)(() => [
  tw`block mb-8 text-center text-[#bbb] hover:text-white`,
  css`
    transition: all 0.7s cubic-bezier(0.165, 0.85, 0.45, 1);
  `
]);


const Footer: FC<FooterProps> = ({ linkedInUsername }: FooterProps) => (
    <FooterContainer>
      <SocialMediaList>
        <FollowMeButton>Follow Me</FollowMeButton>
        <SocialMediaItem href={`https://www.linkedin.com/in/${linkedInUsername}`} target="_blank" className="fab fa-linkedin" aria-label="Follow me on LinkedIn" />
      </SocialMediaList>
    </FooterContainer>
  );

export default Footer;
