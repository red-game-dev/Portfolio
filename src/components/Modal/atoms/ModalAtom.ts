import {
  atom
} from "recoil";

import { ModalType } from "@/types/modal";
import { ProjectDetail } from "@/types/projects";

interface ModalProjectState extends ProjectDetail {
  type: ModalType;
}

export type ModalStateProps = ModalProjectState;

export const AppModalState = atom<ModalStateProps | null>({
  key: "ModalAtom",
  default: null,
});
