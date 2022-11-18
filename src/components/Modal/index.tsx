import tw from "twin.macro";

import { useModalStateHook } from "@/components/Modal/hooks/useModalStateHook";
import { ProjectModal } from "@/components/Modal/ProjectModal";
import useClickOutside from "@/hooks/useClickOutside";

const Content = tw.div`relative text-base ml-[-1px] md:p-[25px] lg:p-[35px] bg-[#101010] border-[1px] border-r-[0px] border-solid border-[rgba(255, 255, 255, 0.07)]`;

const PopupBox = tw.div`fixed top-0 right-0 bottom-0 right-0 w-full h-full z-[999] bg-[#101010] overflow-auto`;

export const Modal = () => {
  const { modalContent, setModal } = useModalStateHook();
  const domNode: any = useClickOutside(() => {
    setModal(null);
  });

  return modalContent && (
    <PopupBox id="popup-1" ref={domNode}>
      <Content className="content">
        {modalContent?.type === "project" && <ProjectModal />}
      </Content>
    </PopupBox>
  );
};
