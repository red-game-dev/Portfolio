import { FC, useCallback, useState } from "react";

import tw, { css, styled } from "twin.macro";

import Link from "next/link";

import { Menu } from "@/components/Menu";
import useCollision from "@/hooks/useCollision";

interface HeaderContainerProps {
  isFixed?: boolean;
}

const HeaderContainer = styled.header(({ isFixed }: HeaderContainerProps) => [
  tw`
    flex items-center justify-between m-0 lg:m-auto py-0 px-[30px] bg-transparent border-b-[transparent] fixed lg:p-[50px] top-6 left-0 right-0 w-full z-[8]
    after:content-[''] after:relative after:block after:clear-both
  `,
  css` 
    transition: all 0.7s cubic-bezier(0.165, 0.85, 0.45, 1);
  `,
  !isFixed && tw`py-[30px] top-0 bg-[#101010]`,
  isFixed && tw`bg-transparent border-b-[transparent]`,
]);

const HeaderContent = tw.div`w-full relative`;

const LogoContainer = styled.div(() => [
  tw`relative overflow-hidden top-0 w-[150px] text-base leading-loose font-semibold text-white opacity-50 whitespace-nowrap z-[5] lg:top-8`,
  css`
    .mask-lnk {
      position: relative;
      top: 0;
      left: 0;
      width: 100%;
      display: block;
      transform: translateY(0);
      transition: opacity 0.7s cubic-bezier(0.165, 0.85, 0.45, 1),
        color 0.7s cubic-bezier(0.165, 0.85, 0.45, 1),
        transform 0.7s cubic-bezier(0.165, 0.85, 0.45, 1);

      &.mask-lnk-hover {
        position: absolute;
        opacity: 0;
        transform: translateY(32px);
      }
      
      strong {
        color: #fff;
      }
    }
  `
]);

const LogoContents = styled.div(() => [
  css`
    &:hover .mask-lnk {
      opacity: 1;
      transform: translateY(-32px);
       
      &.mask-lnk-hover {
        transform: translateY(0);
      }
    }
  `
]);

interface HeaderProps {
  title?: string;
}

const Header: FC<HeaderProps> = ({ title = "" }: HeaderProps) => {
  const [toggle, setToggle] = useState(false);
  const toggleTap = useCallback(() => setToggle(!toggle), [toggle]);
  const [collision] = useCollision("typing-title");
  const words = title.split(" ");
  const { scrollY = -1 } = window || {};

  return (
    <HeaderContainer role="presentation"
      isFixed={collision || scrollY === 0}
      onClick={toggleTap}>
      <HeaderContent>
        <LogoContainer>
          <LogoContents>
            <span className="mask-lnk">
              { words.map((word: string, index: number) => {
                if (index === words.length - 1) {
                  return (<strong key={`word-${index}`}> {word}</strong>);
                }

                return (<span key={`word-${index}`}> {word}</span>);
              })}
            </span>
            <Link href="#section-about" className="mask-lnk mask-lnk-hover" aria-label="Download My CV">
              Download <strong>CV</strong>
            </Link>
          </LogoContents>
        </LogoContainer>
        <Menu active={toggle} />
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
