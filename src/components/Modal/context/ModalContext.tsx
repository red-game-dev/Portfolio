import { createContext, useMemo, useState, Dispatch, ReactNode, SetStateAction } from "react";

import { ModalType } from "@/types/modal";
import { ProjectDetail } from "@/types/projects";

interface ModalProjectState extends ProjectDetail {
  type: ModalType;
}

export type ModalStateProps = ModalProjectState;

export interface ModalState {
  modalContent: ModalStateProps | null;
  setModal: Dispatch<SetStateAction<ModalStateProps | null>>;
}

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalContext = createContext<ModalState | null>(null);

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const [modalContent, setModal] = useState<ModalStateProps | null>(null);

  const value = useMemo(() => ({ modalContent, setModal }), [modalContent]);

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};
