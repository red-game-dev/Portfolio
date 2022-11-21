import { FC, Fragment, useEffect } from "react";

import tw, { styled } from "twin.macro";

import { useAppLoaderStateHook } from "@/components/AppLoader/hooks/useAppLoaderStateHook";

interface PreloaderContainerProps {
  isLoading?: boolean;
}

interface LinesProps {
  isReady?: boolean;
}

interface LineProps {
  isReady?: boolean;
  isLoading?: boolean;
}

const LinesList = styled.div(({ isReady }: LinesProps) => [
  tw`fixed top-0 left-0 w-full h-screen z-[3] text-[0px] pointer-events-none`,
  isReady && tw`z-[3]`,
]);

const LineClasses = "group-[.lines-on]:before:block group-[.lines-off]:before:hidden group-[.no-lines]:before:opacity-0";

const LineCol = styled.div(({ isReady, isLoading = true }: LineProps) => [
  tw`relative inline-block align-top h-screen
  [&:first-child > &.line]:hidden

  w-1/2
  [&:nth-child(3)]:hidden
  [&:nth-child(4)]:hidden
  [&:nth-child(5)]:hidden

  lg:w-1/3
  [&:nth-child(3)]:lg:inline-block
  [&:nth-child(4)]:lg:hidden
  [&:nth-child(5)]:lg:hidden

  xl:w-[20%]
  [&:nth-child(3)]:xl:inline-block
  [&:nth-child(4)]:xl:inline-block
  [&:nth-child(5)]:xl:inline-block

  2xl:w-[20%]
  [&:nth-child(3)]:2xl:inline-block
  [&:nth-child(4)]:2xl:inline-block
  [&:nth-child(5)]:2xl:inline-block
  
  first:before:bg-transparent
  first:after:left-auto
  first:after:left-0
  first:after:h-endless-width

  last:after:right-auto
  last:after:left-0
  last:after:h-endless-width

  first:before:delay-[2.9s]
  first:after:top-0
  first:after:bottom-auto
  first:after:delay-[0.9s]

  [&:nth-child(2)]:before:delay-[2.7s]
  [&:nth-child(2)]:after:top-auto
  [&:nth-child(2)]:after:bottom-0
  [&:nth-child(2)]:after:delay-[0.7s]

  [&:nth-child(3)]:before:delay-[2.2s]
  [&:nth-child(3)]:after:top-0
  [&:nth-child(3)]:after:bottom-auto
  [&:nth-child(3)]:after:delay-[0.2s]

  [&:nth-child(4)]:before:delay-[2.5s]
  [&:nth-child(4)]:after:top-auto
  [&:nth-child(4)]:after:bottom-0
  [&:nth-child(4)]:after:delay-[0.5s]

  [&:nth-child(5)]:before:delay-[3s]
  [&:nth-child(5)]:after:top-0
  [&:nth-child(5)]:after:bottom-auto
  [&:nth-child(5)]:after:delay-[1s]

  before:content['']
  before:absolute
  before:left-0
  before:top-0
  before:w-[1px]
  before:h-[0%]
  before:bg-[rgba(255, 255, 255, 0.07)]
  before:transition-[height 1s cubic-bezier(0.165, 0.85, 0.45, 1) 0s]
  after:content['']
  after:absolute
  after:left-0
  after:top-0
  after:w-full
  after:h-full
  after:bg-[#1E1E1E]
  after:z-[12]
  after:transition-[height 1s cubic-bezier(0.165, 0.85, 0.45, 1) 0s]`,
  isReady && tw`z-[11]`,
  !isLoading && tw`after:h-[0%] before:h-full first:after:h-[0%] last:after:h-[0%]`,
]);

const PreloadingContainer = styled.div(({ isLoading = true }: PreloaderContainerProps) => [
  tw`fixed inset-0 text-center z-[11111] hidden`,
  isLoading && tw`block`,
]);

const PreloadingCentralized = tw.div`table table-fixed h-full w-full max-w-full relative top-0 left-0 z-[2]`;

const PreloadingSpinner = tw.div`absolute left-1/2 top-0 w-[1px] h-full`;

const PreloadingSpinnerBounce = tw.div`absolute top-0 left-0 w-full h-full`;
const PreloadingSpinnerAnimation = tw.div`absolute top-0 left-0 w-full bg-[#4bffa5] h-[0px] animate-[loading 2.0s infinite ease-in-out;]`;

export const AppLoadingLines: FC = () => {
  const { isLoading, isReady } = useAppLoaderStateHook();

  return (
    <LinesList isReady={isReady} className="group">
      <LineCol isReady={isReady} isLoading={isLoading} className={LineClasses} />
      <LineCol isReady={isReady} isLoading={isLoading} className={LineClasses} />
      <LineCol isReady={isReady} isLoading={isLoading} className={LineClasses} />
      <LineCol isReady={isReady} isLoading={isLoading} className={LineClasses} />
      <LineCol isReady={isReady} isLoading={isLoading} className={LineClasses} />
    </LinesList>
  );
};

export const AppLoader: FC = () => {
  const { isLoading, setIsLoading, isReady, setIsReady } = useAppLoaderStateHook();

  useEffect(() => {
    const timeoutReady = setTimeout(() => {
      if (!isReady) {
        setIsReady(true);
      }
    }, 3000);
    const timeoutLoading = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 1000);

    return () => {
      clearInterval(timeoutReady);
      clearInterval(timeoutLoading);
    };
  }, [isReady, isLoading, setIsReady, setIsLoading]);

  return (
    <Fragment>
      <PreloadingContainer isLoading={isLoading}>
        <PreloadingCentralized>
          <PreloadingSpinner>
            <PreloadingSpinnerBounce />
            <PreloadingSpinnerAnimation />
          </PreloadingSpinner>
        </PreloadingCentralized>
      </PreloadingContainer>
    </Fragment>
  );
};
