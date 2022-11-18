import tw, { styled } from "twin.macro";

import { useModalStateHook } from "@/components/Modal/hooks/useModalStateHook";
import { ProjectModal } from "@/components/Modal/ProjectModal";
import useClickOutside from "@/hooks/useClickOutside";

const Content = tw.div`relative text-base ml-[-1px] md:p-[25px] lg:p-[35px] bg-[#101010] border-[1px] border-r-[0px] border-solid border-[rgba(255, 255, 255, 0.07)]`;

interface PopupBoxProps {
  isVisible?: boolean;
}

const PopupBox = styled.div(({ isVisible }: PopupBoxProps) => [
  tw`fixed top-0 right-0 bottom-0 right-0 w-full h-full bg-[#101010] overflow-auto`,
  !isVisible && tw`
  absolute
  bg-red-100
  rounded-full w-1/2 h-1/2
  animate-bounce
  transition-[5s all linear]
  delay-1000 z-[-10]`,
  isVisible && tw`z-[9999] animate-[bounceIn 900ms ease-in-out 0s 1]`,
]);

export const Modal = () => {
  const { modalContent, setModal } = useModalStateHook();
  const domNode: any = useClickOutside(() => {
    setModal(null);
  });

  return (
    <PopupBox ref={domNode} isVisible={Boolean(modalContent)}>
      <Content>
        {modalContent?.type === "project" && <ProjectModal />}
      </Content>
    </PopupBox>
  );
};
