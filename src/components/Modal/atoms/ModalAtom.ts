import {
  atom
} from "recoil";

export interface ModalStateProps {
  [x: string]: any;
}

export const AppModalState = atom<ModalStateProps | null>({
  key: "ModalAtom",
  default: null,
});
