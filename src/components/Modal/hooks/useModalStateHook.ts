import {
  useRecoilState
} from "recoil";

import {
  AppModalState,
  ModalStateProps
} from "@/components/Modal/atoms/ModalAtom";

export const useModalStateHook = () => {
  const [modalContent, setModal] = useRecoilState<ModalStateProps | null>(AppModalState);

  return {
    modalContent,
    setModal,
  };
};
