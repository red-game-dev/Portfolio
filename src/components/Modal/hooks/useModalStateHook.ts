import { useContext } from "react";

import {
  ModalContext,
  ModalState
} from "@/components/Modal/context/ModalContext";

export const useModalStateHook = (): ModalState => {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error("useModalStateHook must be used inside a ModalProvider");
  }

  return context;
};
